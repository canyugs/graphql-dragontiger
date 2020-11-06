import _ from 'lodash';

function isNull(value) {
  return value === undefined || value === null;
}

const prefix = 'dragontiger-';

export default function createCache(client) {
  const { session } = client;

  const cache = new Map();

  const load = (name) => {
    const id = `${prefix}${name}`;
    if (cache.has(id) === true) return cache.get(id);

    const result = session.getItem(id);
    if (isNull(result) === false) {
      cache.set(id, JSON.parse(result));
      return cache.get(id);
    }

    return null;
  };

  return {
    get(name) {
      const data = load(name);
      if (data !== null) return data.value;
      return null;
    },
    set(name, value, expiredAt) {
      const id = `${prefix}${name}`;
      const timestamp = expiredAt || (Date.now() + 5000);
      cache.set(id, { value, timestamp });
      if (value instanceof Error) return this;
      session.setItem(id, JSON.stringify({ value, timestamp }));
      return this;
    },
    has(name) {
      const id = `${prefix}${name}`;
      return cache.has(id) === true || isNull(session.getItem(id)) === false;
    },
    delete(name) {
      const id = `${prefix}${name}`;
      cache.delete(id);
      session.removeItem(id);
      return this;
    },
    merge(name, value) {
      const tmp = this.get(name) || {};
      _.merge(tmp, value);
      return tmp;
    },
    expired(name) {
      const data = load(name);
      if (data !== null) return data.timestamp < Date.now();
      return true;
    },
    clear() {
      session.clear();
      cache.clear();
    },
  };
}
