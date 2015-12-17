import Player from "./player"

let Video = {
  init(socket, element) {
    if (!element) { return }

    let msgContainer = document.getElementById("msg-container")
    let msgInput = document.getElementById("msg-input")
    let postButton = document.getElementById("msg-submit")
    let videoId = element.getAttribute("data-id")
    let playerId = element.getAttribute("data-player-id")
    Player.init(element.id, playerId)

    socket.connect()
    let topic = "videos:" + videoId
    let vidChannel = socket.channel(topic)

    postButton.addEventListener("click", e => {
      let payload = {body: msgInput.value, at: Player.getCurrentTime()}
      vidChannel.push("new_annotation", payload)
        .receive("error", e => console.log(e))
      msgInput.value = ""
    })

    vidChannel.on("new_annotation", (resp) => {
      this.renderAnnotation(msgContainer, resp)
    })

    // vidChannel.on("ping", ({count}) => console.log("PING", count))

    msgContainer.addEventListener("click", e => {
      e.preventDefault()
      let node = e.target
      // Get parent if user nick name clicked
      if (node.nodeName == 'B') { node = node.parentNode }
      let seconds = node.getAttribute("data-seek")
      if (!seconds) { return }

      Player.seekTo(seconds)
    })

    vidChannel.join()
      .receive("ok", resp => {
        console.log("joined the video channel", resp)
        this.scheduleMessages(msgContainer, resp.annotations)
      })
      .receive("error", resp => console.log("join failed", reason))
  },

  renderAnnotation(msgContainer, {user, body, at}) {
    let template = document.createElement("div")
    template.innerHTML = `
    <a href="#" data-seek="${at}">
      [${this.formatTime(at)}] <b>${user.username}</b>: ${body}
    </a>
    `
    msgContainer.appendChild(template)
    msgContainer.scrollTop = msgContainer.scrollHeight
  },

  scheduleMessages(msgContainer, annotations) {
    setTimeout(() => {
      if (Player.initialized) {
        let ctime = Player.getCurrentTime()
        let remaining = this.renderAtTime(annotations, ctime, msgContainer)
        this.scheduleMessages(msgContainer, remaining)
      } else {
        this.scheduleMessages(msgContainer, annotations)
      }
    }, 1000)
  },

  renderAtTime(annotations, seconds, msgContainer) {
    return annotations.filter( ann => {
      if (ann.at > seconds) {
        return true
      } else {
        this.renderAnnotation(msgContainer, ann)
        return false
      }
    })
  },

  formatTime(at) {
    let date = new Date(null)
    date.setSeconds(at / 1000)
    return date.toISOString().substr(14, 5)
  }
}
export default Video