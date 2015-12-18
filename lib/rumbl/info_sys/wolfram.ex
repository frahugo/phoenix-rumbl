defmodule Rumbl.InfoSys.Wolfram do
  import SweetXml
  import Ecto.Query, only: [from: 2]
  alias Rumbl.InfoSys.Result

  def start_link(query_str, query_ref, owner, limit) do
    Task.start_link(__MODULE__, :fetch, [query_str, query_ref, owner, limit])
  end

  def fetch(query_str, query_ref, owner, _limit) do
    IO.puts "Querying for #{query_str}"
    query_str
    |> fetch_xml()
    |> xpath(~x"/queryresult/pod[contains(@title, 'Definitions') or contains(@title, 'Result')]/subpod/plaintext/text()")
    |> send_results(query_ref, owner)
  end

  defp fetch_xml(query_str) do
    url = "http://api.wolframalpha.com/v2/query" <>
      "?appid=#{app_id()}" <>
      "&input=#{URI.encode_www_form(query_str)}&format=plaintext"
    IO.inspect url
    {:ok, {_, _, body}} = :httpc.request(String.to_char_list(url))
    IO.inspect(body)
    body
  end

  defp send_results(nil, query_ref, owner) do
    IO.puts "didn't find any answer"
    send(owner, {:results, query_ref, []})
  end
  defp send_results(answer, query_ref, owner) do
    results = [%Result{backend: user(), score: 95, text: to_string(answer)}]
    send(owner, {:results, query_ref, results})
  end

  defp app_id, do: Application.get_env(:rumbl, :wolfram)[:app_id]

  defp user() do
    Rumbl.Repo.one!(from u in Rumbl.User, where: u.username == "wolfram")
  end
end