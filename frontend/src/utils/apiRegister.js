import { api } from "../utils/Api.js";

class ApiRegiser {
  constructor({ baseUrl, headers }) {
    this._headers = headers;
    this._baseUrl = baseUrl;
  }

  register(email, password) {
    return fetch(`${this._baseUrl}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }).then(this._getResponseData);
  }

  login(email, password) {
    return fetch(`${this._baseUrl}/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    }).then(this._getResponseData)
    .then((res) => {
       this._headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${res.token}`,
      };
      api.setHeaders(this._headers);
      return res;
       });
  }

  setHeaders(headers) {
    this._headers = headers;
  }

  getGeneral() {
    return fetch(`${this._baseUrl}/users/me`, {
      method: "GET",
      headers:
        this._headers,
    })
      .then(this._getResponseData)
      .then((data) => data);
  }

  _getResponseData(res) {
    if (!res.ok) {
      return Promise.reject(`Ошибка: ${res.status}`);
    }
    return res.json();
  }
}

export const apiRegister = new ApiRegiser({
  baseUrl: "http://localhost:3000",
});
