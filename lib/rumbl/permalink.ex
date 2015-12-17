defmodule Rumbl.Permalink do
  @behavior Ecto.Type

  def type, do: :id

  def cast(binary) when is_binary(binary) do
    case Integer.parse(binary) do
      {int, _} when int > 0 -> {:ok, int}
      _ -> :error
    end
  end

  def cast(integer) when is_integer(integer) do
    {:ok, integer}
  end

  def case(_) do
    :error
  end

  def dump(integer) when is_integer(integer), do: {:ok, integer}
  def dump(_), do: :error

  def load(integer) when is_integer(integer), do: {:ok, integer}
  def load(_), do: :error
end