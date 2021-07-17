import { API_KEY } from "./config";

const tickersHandlers = new Map([["BTC-DEPENDENT", []]]);
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";
const INVALID_SUB = "500";

let BTC_PRICE = undefined;

socket.addEventListener("message", (e) => {
  let {
    TYPE: type,
    FROMSYMBOL: ticker,
    TOSYMBOL: currency,
    PRICE: newPrice,
    PARAMETER: parameter
  } = JSON.parse(e.data);

  if (type === INVALID_SUB) {
    ticker = parameter.split("~")[2];
    currency = parameter.split("~")[3];
    if (currency === "USD") {
      if (!tickersHandlers.has("BTC")) {
        subscribeToTickerOnWs("BTC", "USD");
      }
      subscribeToTickerOnWs(ticker, "BTC");
      return;
    } else {
      newPrice = "invalid";
    }
  } else if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  newPrice = normalizePrice(newPrice, currency);
  if (ticker === "BTC") {
    BTC_PRICE = newPrice;
  }

  const handlers = tickersHandlers.get(ticker)
    ? [...tickersHandlers.get(ticker)]
    : [];

  handlers.forEach((fn) => fn(newPrice));
});

function normalizePrice(price, toCur) {
  if (toCur === "USD" || price === "invalid") {
    return price;
  } else {
    if (BTC_PRICE === undefined) {
      return "-";
    }
    return price * BTC_PRICE;
  }
}

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(ticker, currency = "USD") {
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~${currency}`]
  });
}

function unsubscribeToTickerOnWs(ticker, currency = "USD") {
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~${currency}`]
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker);
};

export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  unsubscribeToTickerOnWs(ticker);
};

export const getCoinList = async () =>
  fetch(
    "https://min-api.cryptocompare.com/data/all/coinlist?summary=true"
  ).then((r) => r.json());
