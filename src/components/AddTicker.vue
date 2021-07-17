<template>
  <div class="flex">
    <div class="max-w-xs">
      <label for="wallet" class="block text-sm font-medium text-gray-700"
        >Тикер</label
      >
      <div class="mt-1 relative rounded-md shadow-md">
        <input
          v-model="ticker"
          @keydown.enter="add"
          type="text"
          name="wallet"
          id="wallet"
          class="
            block
            w-full
            p-2
            border-gray-300
            text-gray-900
            h-8
            focus:ring-gray-500
            sm:text-sm
            rounded-md
          "
          placeholder="Например DOGE"
        />
      </div>
      <div
        v-if="suggestions.length > 0 && this.ticker.length > 0"
        class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
      >
        <span
          v-for="suggestion of suggestions"
          :key="suggestion"
          @click="(ticker = suggestion), add()"
          class="
            inline-flex
            items-center
            px-2
            m-1
            rounded-md
            text-xs
            font-medium
            bg-gray-300
            text-gray-800
            cursor-pointer
          "
        >
          {{ suggestion }}
        </span>
      </div>
      <div v-if="invalid" class="text-sm text-red-600">
        Такой тикер уже добавлен
      </div>
    </div>
  </div>
  <add-button @click="add()" :disabled="btnDisabled" type="button" />
</template>

<script>
import AddButton from "./AddButton.vue";
import { getCoinList } from "../api";

export default {
  components: {
    AddButton
  },

  data() {
    return {
      ticker: "",
      invalid: false,
      coinList: [],
      suggestions: []
    };
  },

  props: {
    tickers: {
      type: Array,
      required: true,
      default: new Array()
    }
  },

  emits: {
    "add-ticker": (value) => typeof value === "string" && value.length > 0
  },

  async mounted() {
    const data = await getCoinList();
    this.coinList = Object.assign(
      Object.keys(data.Data).map((key) => ({
        sym: data.Data[key]["Symbol"]
      }))
    );
    this.coinList = Object.fromEntries(
      Object.entries(data.Data).map(([k, v]) => [k, v["FullName"]])
    );
  },

  methods: {
    add() {
      if (this.ticker.length === 0) {
        return;
      }
      if (this.tickers.indexOf(this.ticker) !== -1) {
        this.invalid = true;
        return;
      }

      this.$emit("add-ticker", this.ticker);
      this.ticker = "";
    }
  },

  computed: {
    btnDisabled() {
      return this.ticker.length === 0 || this.invalid;
    }
  },

  watch: {
    ticker() {
      if (this.ticker.length === 0) {
        this.suggestions = [];
        return;
      }
      this.invalid = false;
      this.suggestions = Object.keys(this.coinList)
        .filter((key) => {
          return (
            key.includes(this.ticker) ||
            this.coinList[key].includes(this.ticker)
          );
        })
        .slice(0, 4);
    }
  }
};
</script>
