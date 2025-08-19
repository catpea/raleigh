// git@github.com:catpea/raleigh.git this package used to be ladybits, but was renamed to raleigh, this code is still very useful

export function rid() { // Generate ID
  const specs = [[3,'abcdefghijklmnopqrstuvwxyz'],[6, 'abcdefghijklmnopqrstuvwxyz0123456789']]
  return specs.map(([length,chars])=>[...Array(length)].map(() => chars[Math.floor(Math.random() * chars.length)]).join("")).join('');
}

export class EventEmitter {
  events;
  constructor() {
    this.events = new Map();
    this.unsubscribe = new Set();
  }
  on(event, subscriber) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(subscriber);
    return () => this.off(event, subscriber);
  }
  off(event, subscriber) {
    this.events.get(event).delete(subscriber);
  }
  emit(event, data) {
    const subscribers = this.events.get(event) ?? new Set();
    for (const subscriber of subscribers) {
      subscriber(data);
    }
  }
  terminate() {

    this.unsubscribe.forEach((subscriber) => subscriber());
    this.unsubscribe.clear();

    this.events.forEach((subscribers) => subscribers.clear());
    this.events.clear();
  }
}

class StreamEmitter extends EventEmitter {
  name = "StreamEmitter";
  source; // source emitter

  // SIGNAL INTEGRATION - Makes StreamEmitter behave a little bit like a signal
  replayLast = false;
  lastValue = null;
  lastValueTest = (v)=>v!==null;

  constructor() {
    super();
  }

  emitValue(value) {
    if(this.replayLast) this.lastValue = value;

    this.emit("value", value);
  }
  subscribe(subscriber) {

    // SIGNAL INTEGRATION
    if(this.replayLast && this.lastValueTest(this.lastValue)) subscriber(this.lastValue)

    this.on("value", (v) => subscriber(v, this));
    return () => this.off("value", subscriber);
  }

  get path() {
    const sources = [];
    const getNextItem = (node) => node.source;
    let next = this;
    while (next) {
      sources.unshift(next);
      next = getNextItem(next);
    }
    return sources;
  }
  terminate() {
    this.path.forEach(fragment.terminate());
    super.terminate();
  }
}

export class ReactiveEmitter extends StreamEmitter {

  name = "ReactiveEmitter";

  fromEvent(...argv) {
    return fromEvent(this, ...argv);
  }

  iterate(...argv) {
    return iterate(this, ...argv);
  }

  map(...argv) {
    return map(this, ...argv);
  }

  filter(...argv) {
    return filter(this, ...argv);
  }

  debounce(...argv) {
    return debounce(this, ...argv);
  }

  distinctUntilChanged(...argv) {
    return distinctUntilChanged(this, ...argv);
  }

  scan(...argv) {
    return scan(this, ...argv);
  }

  delay(...argv) {
    return delay(this, ...argv);
  }

  throttle(...argv) {
    return throttle(this, ...argv);
  }

  withLatestFrom(...argv) {
    return withLatestFrom(this, ...argv);
  }

  merge(...argv) {
    return merge(this, ...argv);
  }

}

export class Signal {
  name = "Signal";
  #id;
  #value;
  #test;
  #same;
  #subscribers;

  // NOTE: Re: test=v=>!v==undefined... null and undefined are considered equal when using the loose equality operator

  constructor(value, same = (a,b) => a==b, test = (v) => v !== undefined) {
    this.#value = value;
    this.#test = test;
    this.#same = same;
    this.#subscribers = new Set();
  }

  get id() {
    if (!this.#id) this.#id = rid();
    return this.#id;
  }

  get value() {
    return this.#value;
  }

  set value(newValue) {
    if (this.#same(this.#value, newValue)) return;
    this.#value = newValue;
    this.notify();
  }

  subscribe(subscriber) {
    if (this.#test(this.#value)) subscriber(this.#value);
    this.#subscribers.add(subscriber);
    return () => this.#subscribers.delete(subscriber);
  }

  notify() {
    for (const subscriber of this.#subscribers) subscriber(this.#value);
  }

}

export class ReactiveSignal extends Signal {
  name = "ReactiveSignal";

  iterate(...argv) {
    return iterate(this, ...argv);
  }

  map(...argv) {
    return map(this, ...argv);
  }

  filter(...argv) {
    return filter(this, ...argv);
  }

  debounce(...argv) {
    return debounce(this, ...argv);
  }

  distinctUntilChanged(...argv) {
    return distinctUntilChanged(this, ...argv);
  }

  scan(...argv) {
    return scan(this, ...argv);
  }

  delay(...argv) {
    return delay(this, ...argv);
  }

  throttle(...argv) {
    return throttle(this, ...argv);
  }

  withLatestFrom(...argv) {
    return withLatestFrom(this, ...argv);
  }

  merge(...argv) {
    return merge(this, ...argv);
  }

}

// Object Stream Operators

export function iterate(source) {
  const result = new ReactiveEmitter();
  result.name = "iterate";
  result.source = source;

  source.subscribe((array) => {
    array.forEach((item) => result.emitValue(item));
  });
  return result;
}

export function map(source, predicate) {
  const result = new ReactiveEmitter();
  result.name = "filter";
  result.source = source;

  source.subscribe((value) => {
    result.emitValue(predicate(value));
  });

  return result;
}

export function filter(source, predicate) {
  const result = new ReactiveEmitter();
  result.name = "filter";
  result.source = source;

  source.subscribe((value) => {
    if (predicate(value)) {
      result.emitValue(value);
    }
  });

  return result;
}

export function debounce(source, ms) {
  const result = new ReactiveEmitter();
  result.name = "debounce";
  result.source = source;

  let timeout;

  source.subscribe((value) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      result.emitValue(value);
    }, ms);
  });

  return result;
}

// Distinct filters out all duplicate values from an observable sequence, while distinctUntilChanged only removes consecutive duplicates, allowing the first occurrence of each value to pass through. This means distinctUntilChanged is useful for preventing repeated emissions of the same value in a row.
export function distinctUntilChanged(source, compareFn = (a, b) => a === b) {
  const result = new ReactiveEmitter();
  result.name = "distinctUntilChanged";
  result.source = source;

  let last;

  source.subscribe((value) => {
    if (last === undefined || !compareFn(value, last)) {
      last = value;
      result.emitValue(value);
    }
  });

  return result;
}

export function scan(source, accumulator, seed) {
  const result = new ReactiveEmitter();
  result.name = "scan";
  result.source = source;

  let acc = seed;

  source.subscribe((value) => {
    acc = accumulator(acc, value);
    result.emitValue(acc);
  });

  return result;
}

export function delay(source, ms) {
  const result = new ReactiveEmitter();
  result.name = "delay";
  result.source = source;

  source.subscribe((value) => {
    setTimeout(() => result.emitValue(value), ms);
  });

  return result;
}

export function throttle(source, ms) {
  const result = new ReactiveEmitter();
  result.name = "throttle";
  result.source = source;

  let lastTime = 0;

  source.subscribe((value) => {
    const now = Date.now();
    if (now - lastTime >= ms) {
      lastTime = now;
      result.emitValue(value);
    }
  });

  return result;
}

export function withLatestFrom(source, other) {
  const result = new ReactiveEmitter();
  result.name = "withLatestFrom";
  result.source = source;

  let latestOther;

  other.subscribe((value) => {
    latestOther = value;
  });

  source.subscribe((value) => {
    if (latestOther !== undefined) {
      result.emitValue([value, latestOther]);
    }
  });

  return result;
}

export function merge(...emitters) {
  const result = new ReactiveEmitter();
  result.name = "merge";
  result.source = source;

  emitters.forEach((emitter) => {
    emitter.subscribe((value) => result.emitValue(value));
  });

  return result;
}

// export function fromEvent(source, eventName) {
//   const result = new ReactiveEmitter();

//   result.name = "fromEvent";
//   result.source = source;

//   source.on(eventName, value => {
//     result.emitValue(value);
//   });

//   return result;

// }
export function fromEvent(source, eventName) {
  const result = new ReactiveEmitter();
  result.name = "fromEvent";
  result.source = source;

  // Create a function to handle the event
  const eventHandler = (value) => {
    result.emitValue(value);
  };

  // Check if the source is a DOM element or an event emitter
  if (source instanceof EventTarget) {
    // For DOM events
    source.addEventListener(eventName, eventHandler);

    // Add the unsubscribe function to the Set
    result.unsubscribe.add(() => {
      source.removeEventListener(eventName, eventHandler);
    });
  } else {
    // For other event emitters
    source.on(eventName, eventHandler);

    // Add the unsubscribe function to the Set
    result.unsubscribe.add(() => {
      source.off(eventName, eventHandler); // Assuming there's an off method
    });
  }

  return result;
}




export function namedCombineLatest(namedSignals) {
  console.log({namedSignals})
  const result = new ReactiveEmitter();
  result.replayLast = true;
  result.name = "watchNamed";

  const signalNames = Object.keys(namedSignals);
  // const emitters = Object.values(namedSignals);
  const values = new Array(signalNames.length);
  const hasValue = new Array(signalNames.length).fill(false);

  let completedCount = 0;

  Object.entries(namedSignals).forEach(([name, signal], index) => {

    signal.subscribe((value) => {

      values[index] = value;
      hasValue[index] = true;

      // Check if all emitters have emitted at least once
      console.log('ZZZ hasValue.every(Boolean)', hasValue.every(Boolean), hasValue)
      if (hasValue.every(Boolean)) {

        const entries = new Array(signalNames.length);
        for( const [index, name] of signalNames.entries()){
          entries[index] = [name, values[index]];
        }
        const obj = Object.fromEntries(entries)
        console.log('ZZZ REESDY>', obj)
        result.emitValue(obj); // Emit an array of values
      }
    }); // subscribe to emitter

  });

  return result;
}
