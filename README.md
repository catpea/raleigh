# raleigh
Powerful Reactive Framework based on EventEmitter, Signals, and Object Stream Operators

# Reactive Event Emitter Library

A minimal, composable, and extensible event-driven programming toolkit for JavaScript/TypeScript environments. This library provides a foundational set of classes and operators for building reactive data flows, signal-based state management, and event emission pipelines, inspired by concepts from RxJS and functional programming.

## Features

- **EventEmitter**: Lightweight event subscription and emission.
- **StreamEmitter**: Data stream abstraction with chainable operators.
- **ReactiveEmitter**: StreamEmitter with built-in reactive operators (filter, debounce, scan, etc.).
- **Signal**: Encapsulated, observable value with subscriber management.
- **ReactiveSignal**: Signal with chainable stream operators.
- **Composable Operators**: A suite of functional operators (filter, debounce, scan, delay, throttle, merge, withLatestFrom, etc.).

## Installation

```bash
npm install raleigh
```

Or simply copy the source file into your project.

## Usage

### Basic Event Emission

```js
import { EventEmitter } from 'raleigh';

const emitter = new EventEmitter();

const unsubscribe = emitter.on('event', (data) => {
  console.log('Received:', data);
});

emitter.emit('event', { message: 'Hello World' });

unsubscribe(); // Remove the subscriber
```

### Reactive Streams

```js
import { ReactiveEmitter } from 'raleigh';

const stream = new ReactiveEmitter();

stream
  .filter(v => v > 10)
  .debounce(300)
  .subscribe((value) => {
    console.log('Filtered and debounced value:', value);
  });

stream.emitValue(5);   // No output
stream.emitValue(15);  // Output after 300ms: 15
```

### Signals

```js
import { ReactiveSignal } from 'raleigh';

const count = new ReactiveSignal(0);

const unsubscribe = count
  .scan((acc, n) => acc + n, 0)
  .subscribe(val => console.log('Accumulated:', val));

count.value = 1; // Accumulated: 1
count.value = 2; // Accumulated: 3

unsubscribe();
```

## API Reference

### EventEmitter

- `on(event, subscriber)`: Subscribe to an event. Returns an unsubscribe function.
- `off(event, subscriber)`: Unsubscribe from an event.
- `emit(event, data)`: Emit data to all subscribers of an event.
- `terminate()`: Remove all events and subscribers.

### StreamEmitter

- Extends `EventEmitter`.
- `emitValue(value)`: Emit a value on the `"value"` event.
- `subscribe(subscriber)`: Subscribe to `"value"` events. Returns an unsubscribe function.
- `path`: Array of chained emitters (for introspection).
- Operators from `operators` object are attached as instance methods.

### ReactiveEmitter

- Extends `StreamEmitter`.
- Built-in chainable stream operators: `iterate`, `filter`, `debounce`, `distinctUntilChanged`, `scan`, `delay`, `throttle`, `withLatestFrom`, `merge`.

### Signal

- Encapsulates a value with reactive subscription.
- `value`: Getter/setter for the current value (setting calls `notify()`).
- `subscribe(subscriber)`: Subscribe to value changes. Returns an unsubscribe function.
- `notify()`: Notifies all current subscribers.
- `id`: Unique identifier for the signal.

### ReactiveSignal

- Extends `Signal`.
- Exposes chainable operators as instance methods.

### Operators

- `iterate(source)`
- `filter(source, predicate)`
- `debounce(source, ms)`
- `distinctUntilChanged(source, [compareFn])`
- `scan(source, accumulator, seed)`
- `delay(source, ms)`
- `throttle(source, ms)`
- `withLatestFrom(source, other)`
- `merge(...emitters)`

Each operator returns a new `ReactiveEmitter` instance and can be chained.

## Design Principles

- **Simplicity**: No dependencies, minimal API surface.
- **Composability**: Operators can be chained or composed for complex data flows.
- **Extensibility**: Add new stream operators or signals as needed.
- **Encapsulation**: Signals and emitters encapsulate their state and manage subscribers internally.

## Acknowledgements

Written for educaion, inspired by Signals, Observables, EventEmitter and many functional reactive programming libraries.
