# use-select

⚛️ Hooks for building enhanced input components in React

<!-- <a href="https://travis-ci.org/tannerlinsley/use-select" target="\_parent">
  <img alt="" src="https://travis-ci.org/tannerlinsley/use-select.svg?branch=master" />
</a> -->
<a href="https://npmjs.com/package/use-select" target="\_parent">
  <img alt="" src="https://img.shields.io/npm/dm/use-select.svg" />
</a>
<a href="https://bundlephobia.com/result?p=use-select" target="\_parent">
  <img alt="" src="https://badgen.net/bundlephobia/minzip/use-select" />
</a>
<a href="https://github.com/tannerlinsley/use-select" target="\_parent">
  <img alt="" src="https://img.shields.io/github/stars/tannerlinsley/use-select.svg?style=social&label=Star" />
</a>
<a href="https://twitter.com/tannerlinsley" target="\_parent">
  <img alt="" src="https://img.shields.io/twitter/follow/tannerlinsley.svg?style=social&label=Follow" />
</a>
<br />
<br />
<a href="https://patreon.com/tannerlinsley">
  <img width="180" alt="" src="https://raw.githubusercontent.com/tannerlinsley/files/master/images/patreon/become-a-patron.png" />
</a>

## Features

- Headless
- Multi-Select
- Taggable
- Extensible
- 4kb gzipped

## Demo

- [CodeSandbox](https://codesandbox.io/s/p5m42lr5rq)

## Installation

```sh
yarn add use-select
# or
npm i -s use-select
```

## Basic Usage

```js
import React, { useRef } from 'react'
import useSelect from 'use-select'

// Create your select component
function MySelect({
  value,
  options,
  onChange,
  multi,
  pageSize = 10,
  itemHeight = 40
}) {
  // Create a ref for the options container
  const optionsRef = useRef()

  // Use useSelect to manage select state
  const {
    visibleOptions,
    selectedOption,
    highlightedOption,
    getInputProps,
    getOptionProps,
    isOpen
  } = useSelect({
    multi,
    options,
    value,
    onChange,
    optionsRef
  })

  // Build your select component
  return (
    <div>
      {multi ? (
        <div>
          {selectedOption.map(option => (
            <div key={option.value}>
              {option.value}{' '}
              <span
                onClick={() => onChange(value.filter(d => d !== option.value))}
              >
                x
              </span>
            </div>
          ))}
        </div>
      ) : null}
      <input {...getInputProps()} placeholder="Select one..." />
      <div>
        {isOpen ? (
          <div ref={optionsRef}>
            {!visibleOptions.length ? (
              <div>No options were found...</div>
            ) : null}
            {visibleOptions.map(option => {
              return (
                <div
                  {...getOptionProps({
                    option,
                    style: {
                      background: `${props =>
                        highlightedOpion === option
                          ? 'lightblue'
                          : selectedOption === option
                          ? 'lightgray'
                          : 'white'}`
                    }
                  })}
                >
                  {option.label}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
    </div>
  )
}
```

# Documentation

## Options

`useSelect` accepts a single `object` of options. Some options are required.

| Option         | Required | Type                                            | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------- | -------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| multi          |          | `Boolean`                                       | When `true`, multi-select mode is used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| create         |          | `Boolean`                                       | When `true`, create mode is used.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| duplicates     |          | `Boolean`                                       | When `true`, allows options with duplicate values to be selected in multi-mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| options        | true     | `Array[{value, lable})`                         | An array of option objects. Each object should contain a `value` and `label` property                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| value          | true     | `any || Array[any]`                             | The current value, or array of values if using `multi` mode                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| onChange       | true     | `Function(value)`                               | The function that will be called with the new value(s) when the select is updated. This function will be passed a single value eg. `onChange(newValue)` when using single mode, or an array of values, with the newly added value as the second parameter eg. `onChange([...values], newValue)` when using `multi` mode                                                                                                                                                                                                                                                   |
| scrollToIndex  |          | `Function(optionIndex)`                         | A function that is called when the highlighted option index changes and should be scroll to. This is useful for custom windowing libraries like `react-window` or `react-virtualized`.                                                                                                                                                                                                                                                                                                                                                                                    |
| shiftAmount    |          | `Number`                                        | The amount of options to navigate when using the keyboard to navigate with the `shift` key. Defaults to `5`                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| filterFn       |          | `Function(options, searchValue) => Options[]`   | A custom function can be used here to filter and rank/sort the options based on the search value. It is passed the `options` array and the current `searchValue` and should return the filtered and sorted array of options to be displayed. By default a basic filter/sort function is provided. This function compares lowercase versions of the `label`s and `searchValue` using `String.contains()` and `String.indexOf()` to filter and sort the options. For a more robust ranking, we recommend using [`match-sorter`](https://github.com/kentcdodds/match-sorter) |
| getCreateLabel |          | `Function(searchValue) => String`               | A custom function can be used here to format and return the label that is used to create new values in create mode                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| optionsRef     | true     | `React.createRef()` or `useRef()` instance      | This ref is used to track outside clicks that close the options panel. Though not strictly required, it is highly recommended. You are then required to place this ref on the React element or compoenent that renders your options.                                                                                                                                                                                                                                                                                                                                      |
| stateReducer   |          | `Function(oldState, newState, action) => state` | A function that can be used to reduce the internal state of hook. Action types are available at `useSelect.actions`                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Api

`useSelect` returns an object of values and functions that you can use to build your select component:

| Property          | Type                               | Description |
| ----------------- | ---------------------------------- | ----------- |
| _State_           |                                    |             |
| visibleOptions    | Array<Option>                      | --          |
| selectedOption    | Option                             | --          |
| highlightedOption | Option                             | --          |
| searchValue       | String                             | --          |
| isOpen            | Bool                               | --          |
| _Actions_         |                                    |             |
| highlightIndex    | Function(Int)                      | --          |
| selectOption      | Function(Option)                   | --          |
| removeValue       | Function(Int)                      | --          |
| setOpen           | Function(Bool)                     | --          |
| setSearch         | Function(String)                   | --          |
| _Prop Getters_    |                                    |             |
| getInputProps     | Function(userProps) => inputProps  | --          |
| getOptionProps    | Function(userProps) => optionProps | --          |
| _Other_           |                                    |             |
| optionsRef        | React Ref                          | --          |

## Custom Windowing and Styles

`useSelect` is built as a headless hook so as to allow you to render and style your select component however you'd like. [This codesandbox example](https://codesandbox.io/s/p5m42lr5rq) shows a simple example of using `react-window` and `styled-components` to do that.

## How was use-select built?!

Watch this two-part series on how I built it from the ground up using React hooks!

- [Part 1](https://www.youtube.com/watch?v=zIwcBmdExq8)
- [Part 2](https://www.youtube.com/watch?v=pGagVWf6Atc)

## Contribution and Roadmap

- [ ] Improve Accessibility (Hopefully to the level of Downshift)
- [ ] Write Tests
- [ ] Continuous Integration & Automated Releases

Open an issue or PR to discuss!

## Inspiration and Thanks

This library was heavily inspired by [Downshift](https://github.com/paypal/downshift). Thank you to all of its contributors!
