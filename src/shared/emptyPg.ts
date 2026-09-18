// Empty stub for pg and related database libraries in browser client build
export class Pool {
  query() { return Promise.resolve({ rows: [] }); }
  connect() { return Promise.resolve({ query: () => Promise.resolve({ rows: [] }), release: () => {} }); }
  on() { return this; }
  end() { return Promise.resolve(); }
}

export class Client {
  connect() { return Promise.resolve(); }
  query() { return Promise.resolve({ rows: [] }); }
  end() { return Promise.resolve(); }
}

export const types = {
  getTypeParser: () => (val: any) => val,
  setTypeParser: () => {},
};

export const parse = () => ({});

export default {
  Pool,
  Client,
  types,
  parse
};
