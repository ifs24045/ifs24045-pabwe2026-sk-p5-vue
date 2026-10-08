import { defineStore } from "pinia";
import * as aucationApi from "../api/aucationApi";
import { isSuccess, getErrorMessage } from "../../../helpers/apiHelper";
import {
  showSuccessDialog,
  showErrorDialog,
} from "../../../helpers/toolsHelper";

// Pola yang sama untuk semua aksi mutasi:
// set flag "sedang berjalan" -> panggil API -> dialog -> set flag "berhasil"
async function mutate(store, { pending, done, request }) {
  store[pending] = true;
  store[done] = false;
  const response = await request();
  store[pending] = false;

  if (!isSuccess(response)) {
    showErrorDialog(getErrorMessage(response));
    return false;
  }

  store[done] = true;
  showSuccessDialog(response.message);
  return true;
}

export const useAucationsStore = defineStore("aucations", {
  state: () => ({
    aucations: [],
    aucation: null,
    isAucation: false,

    isAucationAdd: false,
    isAucationAdded: false,
    isAucationChange: false,
    isAucationChanged: false,
    isAucationChangeCover: false,
    isAucationChangedCover: false,
    isAucationDelete: false,
    isAucationDeleted: false,
    isBidAdd: false,
    isBidAdded: false,
    isBidDelete: false,
    isBidDeleted: false,
    isAucationDeleteAll: false,
    isAucationDeletedAll: false,
  }),

  actions: {
    async fetchAucations(params = {}) {
      this.isAucation = true;
      const response = await aucationApi.getAucations(params);
      this.isAucation = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      this.aucations = response.data.aucations;
      return true;
    },

    async fetchAucation(id) {
      this.isAucation = true;
      const response = await aucationApi.getAucationById(id);
      this.isAucation = false;

      if (!isSuccess(response)) {
        showErrorDialog(getErrorMessage(response));
        return false;
      }

      this.aucation = response.data.aucation;
      return true;
    },

    addAucation(payload) {
      return mutate(this, {
        pending: "isAucationAdd",
        done: "isAucationAdded",
        request: () => aucationApi.addAucation(payload),
      });
    },

    changeAucation(id, payload) {
      return mutate(this, {
        pending: "isAucationChange",
        done: "isAucationChanged",
        request: () => aucationApi.updateAucation(id, payload),
      });
    },

    changeCover(id, file) {
      return mutate(this, {
        pending: "isAucationChangeCover",
        done: "isAucationChangedCover",
        request: () => aucationApi.updateCover(id, file),
      });
    },

    deleteAucation(id) {
      return mutate(this, {
        pending: "isAucationDelete",
        done: "isAucationDeleted",
        request: () => aucationApi.deleteAucation(id),
      });
    },

    addBid(id, bid) {
      return mutate(this, {
        pending: "isBidAdd",
        done: "isBidAdded",
        request: () => aucationApi.addBid(id, bid),
      });
    },

    deleteBid(id) {
      return mutate(this, {
        pending: "isBidDelete",
        done: "isBidDeleted",
        request: () => aucationApi.deleteBid(id),
      });
    },

    deleteAllAucations() {
      return mutate(this, {
        pending: "isAucationDeleteAll",
        done: "isAucationDeletedAll",
        request: () => aucationApi.deleteAllAucations(),
      });
    },
  },
});