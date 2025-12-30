export const session = {
  token: null,
  user: null,
  setAuth(token, user) {
    this.token = token;
    this.user = user;
  },
  clear() {
    this.token = null;
    this.user = null;
  }
};
