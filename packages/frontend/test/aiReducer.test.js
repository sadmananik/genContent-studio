import { createAiReducer } from "../src/store/reducers/aiReducer";
import { apiRequest } from "../src/lib/apiClient";

jest.mock("../src/lib/apiClient", () => ({ apiRequest: jest.fn() }));

function createStore(chats) {
  let state;
  const reducer = createAiReducer((update) => {
    state = { ...state, ...(typeof update === "function" ? update(state) : update) };
  });
  state = {
    ...reducer,
    aiState: { ...reducer.aiState, chatHistory: chats, favouriteResponses: chats }
  };
  return { reducer, getState: () => state };
}

test.each(["text", "image"])(
  "favouriting one %s response leaves other MongoDB-ID responses unchanged",
  async (contentType) => {
    const chats = [
      { _id: "first", contentType, isFavourite: false },
      { _id: "second", contentType, isFavourite: false }
    ];
    const { reducer, getState } = createStore(chats);
    apiRequest.mockResolvedValue({ ...chats[0], isFavourite: true });
    await reducer.toggleAiResponseFavourite("first", true);
    expect(getState().aiState.chatHistory).toEqual([{ ...chats[0], isFavourite: true }, chats[1]]);
    expect(getState().aiState.favouriteResponses[1]).toEqual(chats[1]);
  }
);

test("unfavouriting an id-only response removes only that favourite", async () => {
  const chats = [
    { id: "first", isFavourite: true },
    { id: "second", isFavourite: true }
  ];
  const { reducer, getState } = createStore(chats);
  apiRequest.mockResolvedValue({ ...chats[0], isFavourite: false });
  await reducer.toggleAiResponseFavourite("first", false);
  expect(getState().aiState.favouriteResponses).toEqual([chats[1]]);
  expect(getState().aiState.chatHistory[1]).toEqual(chats[1]);
});
