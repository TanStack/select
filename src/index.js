import React from 'react'

const defaultFilterFn = (options, searchValue) => {
  return options
    .filter(option =>
      option.value.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a, b) => {
      return a.value.toLowerCase().indexOf(searchValue.toLowerCase())
    })
}

function useDebounce(fn, time = 0) {
  const ref = React.useRef(null)
  const fnRef = React.useRef()

  fnRef.current = fn

  React.useEffect(() => {
    return () => {
      clearTimeout(ref.current)
    }
  }, [time])

  return React.useCallback(
    async (...args) => {
      if (ref.current) {
        clearTimeout(ref.current)
      }
      return new Promise((resolve, reject) => {
        ref.current = setTimeout(() => {
          ref.current = null
          try {
            resolve(fnRef.current(...args))
          } catch (err) {
            reject(err)
          }
        }, time)
      })
    },
    [time]
  )
}

const initialState = {
  searchValue: '',
  resolvedSearchValue: '',
  isOpen: false,
  highlightedIndex: 0
}

const actions = {
  setOpen: 'setOpen',
  setSearch: 'setSearch',
  highlightIndex: 'highlightIndex'
}

function useHoistedState(initialState, reducer) {
  const reducerRef = React.useRef()
  reducerRef.current = reducer
  const [state, _setState] = React.useState(initialState)
  const setState = React.useCallback(
    (updater, action) => {
      if (!action) {
        throw new Error('An action type is required to update the state')
      }
      return _setState(old => reducerRef.current(old, updater(old), action))
    },
    [_setState]
  )
  return [state, setState]
}

export default function useSelect({
  multi,
  create,
  getCreateLabel = d => `Use "${d}"`,
  stateReducer = (old, newState, action) => newState,
  duplicates,
  options,
  value,
  onChange,
  scrollToIndex = () => {},
  shiftAmount = 5,
  filterFn = defaultFilterFn,
  optionsRef,
  getDebounce = options =>
    options.length > 10000 ? 1000 : options.length > 1000 ? 200 : 0
}) {
  const [
    { searchValue, resolvedSearchValue, isOpen, highlightedIndex },
    setState
  ] = useHoistedState(initialState, stateReducer)

  // Refs

  const inputRef = React.useRef()
  const onBlurRef = React.useRef({})
  const onChangeRef = React.useRef()
  const filterFnRef = React.useRef()
  const getCreateLabelRef = React.useRef()
  const scrollToIndexRef = React.useRef()

  filterFnRef.current = filterFn
  scrollToIndexRef.current = scrollToIndex
  getCreateLabelRef.current = getCreateLabel

  onChangeRef.current = onChange

  // We need to memoize these default values to keep things
  // from rendering without cause
  const defaultMultiValue = React.useMemo(() => [], [])
  const defaultOptions = React.useMemo(() => [], [])

  // Multi should always at least have an empty array as the value
  if (multi && typeof value === 'undefined') {
    value = defaultMultiValue
  }

  // If no options are provided, then use an empty array
  if (!options) {
    options = defaultOptions
  }

  const originalOptions = options

  // If multi and duplicates aren't allowed, filter out the
  // selected options from the options list
  options = React.useMemo(() => {
    if (multi && !duplicates) {
      return options.filter(d => !value.includes(d.value))
    }
    return options
  }, [options, value, duplicates, multi])

  // Compute the currently selected option(s)
  let selectedOption = React.useMemo(() => {
    if (!multi) {
      return (
        originalOptions.find(d => d.value === value) || {
          label: value,
          value: value
        }
      )
    } else {
      return value.map(
        val =>
          originalOptions.find(d => d.value === val) || {
            label: val,
            value: val
          }
      )
    }
  }, [multi, value, originalOptions])

  // If there is a search value, filter the options for that value
  // TODO: This is likely where we will perform async option fetching
  // in the future.
  options = React.useMemo(() => {
    if (resolvedSearchValue) {
      return filterFnRef.current(options, resolvedSearchValue)
    }
    return options
  }, [options, resolvedSearchValue])

  // If in create mode and we have a search value, fabricate
  // an option for that searchValue and prepend it to options
  options = React.useMemo(() => {
    if (create && searchValue) {
      return [
        { label: getCreateLabelRef.current(searchValue), value: searchValue },
        ...options
      ]
    }
    return options
  }, [create, searchValue, options])

  // Actions

  const setOpen = React.useCallback(
    newIsOpen => {
      setState(
        old => ({
          ...old,
          isOpen: newIsOpen
        }),
        actions.setOpen
      )
    },
    [setState]
  )

  const setResolvedSearch = useDebounce(value => {
    setState(
      old => ({
        ...old,
        resolvedSearchValue: value
      }),
      actions.setSearch
    )
  }, getDebounce(options))

  const setSearch = React.useCallback(
    value => {
      setState(
        old => ({
          ...old,
          searchValue: value
        }),
        actions.setSearch
      )
      setResolvedSearch(value)
    },
    [setState, setResolvedSearch]
  )

  const highlightIndex = React.useCallback(
    value => {
      setState(old => {
        return {
          ...old,
          highlightedIndex: Math.min(
            Math.max(
              0,
              typeof value === 'function' ? value(old.highlightedIndex) : value
            ),
            options.length - 1
          )
        }
      }, actions.highlightIndex)
    },
    [options, setState]
  )

  const selectIndex = React.useCallback(
    index => {
      const option = options[index]
      if (option) {
        if (!multi) {
          onChangeRef.current(option.value)
        } else {
          if (duplicates || !value.includes(option.value)) {
            onChangeRef.current([...value, option.value], option.value)
          }
        }
      }

      if (!multi) {
        setOpen(false)
      } else {
        setSearch('')
      }
    },
    [multi, options, duplicates, value, setOpen, setSearch]
  )

  const removeValue = React.useCallback(
    index => {
      onChangeRef.current(value.filter((d, i) => i !== index))
    },
    [value]
  )

  // Handlers

  const handleSearchValueChange = e => {
    setSearch(e.target.value)
    setOpen(true)
  }

  const handleSearchClick = () => {
    if (!create || multi) {
      setSearch('')
    }
    setOpen(true)
  }

  const handleSearchFocus = () => handleSearchClick()

  // Prop Getters

  const ArrowUp = (defaultShift, defaultMeta) => ({ shift, meta }, e) => {
    e.preventDefault()
    const amount =
      defaultMeta || meta
        ? 1000000000000
        : defaultShift || shift
        ? shiftAmount - 1
        : 1
    setOpen(true)
    highlightIndex(old => old - amount)
  }

  const ArrowDown = (defaultShift, defaultMeta) => ({ shift, meta }, e) => {
    e.preventDefault()
    const amount =
      defaultMeta || meta
        ? 1000000000000
        : defaultShift || shift
        ? shiftAmount - 1
        : 1
    setOpen(true)
    highlightIndex(old => old + amount)
  }

  const Enter = (_, e) => {
    if (isOpen) {
      if (searchValue || options[highlightedIndex]) {
        e.preventDefault()
      }
      if (options[highlightedIndex]) {
        selectIndex(highlightedIndex)
      }
    }
  }

  const Escape = () => {
    setOpen(false)
  }

  const Tab = () => {
    setOpen(false)
  }

  const Backspace = () => {
    if (!multi || searchValue) {
      return
    }
    removeValue(value.length - 1)
  }

  const getKeyProps = useKeys({
    ArrowUp: ArrowUp(),
    ArrowDown: ArrowDown(),
    PageUp: ArrowUp(true),
    PageDown: ArrowDown(true),
    Home: ArrowUp(false, true),
    End: ArrowDown(false, true),
    Enter,
    Escape,
    Tab,
    Backspace
  })

  const getInputProps = ({
    refKey = 'ref',
    ref,
    onChange,
    onFocus,
    onClick,
    onBlur,
    ...rest
  } = {}) => {
    return getKeyProps({
      [refKey]: el => {
        inputRef.current = el
        if (ref) {
          ref.current = el
        }
      },
      value:
        (isOpen ? searchValue : selectedOption ? selectedOption.label : '') ||
        '',
      onChange: e => {
        handleSearchValueChange(e)
        if (onChange) {
          onChange(e)
        }
      },
      onFocus: e => {
        handleSearchFocus(e)
        if (onFocus) {
          onFocus(e)
        }
      },
      onClick: e => {
        handleSearchClick(e)
        if (onClick) {
          onClick(e)
        }
      },
      onBlur: e => {
        if (onBlur) {
          e.persist()
          onBlurRef.current.cb = onBlur
          onBlurRef.current.event = e
        }
      },
      ...rest
    })
  }

  const getOptionProps = ({
    index,
    key = index,
    onClick,
    onMouseEnter,
    ...rest
  } = {}) => {
    if (typeof index !== 'number' || index < 0) {
      throw new Error(
        `useSelect: The getOptionProps prop getter requires an index property, eg. 'getOptionProps({index: 1})'`
      )
    }

    return {
      key,
      ...rest,
      onClick: e => {
        selectIndex(index)
        if (onClick) {
          onClick(e)
        }
      },
      onMouseEnter: e => {
        highlightIndex(index)
        if (onMouseEnter) {
          onMouseEnter(e)
        }
      }
    }
  }

  // Effects

  // When the user clicks outside of the options box
  // while open, we need to close the dropdown
  useClickOutsideRef(
    isOpen,
    () => {
      setOpen(false)
    },
    optionsRef
  )

  // When searching, activate the first option
  React.useEffect(() => {
    highlightIndex(0)
  }, [searchValue, highlightIndex])

  // When we open and close the options, set the highlightedIndex to 0
  React.useEffect(() => {
    highlightIndex(0)

    if (!isOpen && onBlurRef.current.event) {
      onBlurRef.current.cb(onBlurRef.current.event)
      onBlurRef.current.event = null
    }
  }, [isOpen, highlightIndex])

  // When the highlightedIndex changes, scroll to that item
  React.useEffect(() => {
    scrollToIndexRef.current(highlightedIndex)
  }, [highlightedIndex])

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, inputRef.current])

  return {
    // State
    searchValue,
    isOpen,
    highlightedIndex,
    selectedOption,
    visibleOptions: options,
    // Actions
    selectIndex,
    removeValue,
    setOpen,
    setSearch,
    highlightIndex,
    // Prop Getters
    getInputProps,
    getOptionProps
  }
}

useSelect.actions = actions

function useClickOutsideRef(enable, fn, userRef) {
  const localRef = React.useRef()
  const fnRef = React.useRef()

  fnRef.current = fn
  const elRef = userRef || localRef

  const handle = React.useCallback(
    e => {
      const isTouch = e.type === 'touchstart'
      if (e.type === 'click' && isTouch) {
        return
      }
      const el = elRef.current
      if (el && !el.contains(e.target)) fnRef.current(e)
    },
    [elRef]
  )

  React.useEffect(() => {
    if (enable) {
      document.addEventListener('touchstart', handle, true)
      document.addEventListener('click', handle, true)
    }

    return () => {
      document.removeEventListener('touchstart', handle, true)
      document.removeEventListener('click', handle, true)
    }
  }, [enable, handle])
}

const useKeys = userKeys => {
  return ({ onKeyDown, ...rest } = {}) => {
    return {
      ...rest,
      onKeyDown: e => {
        const { keyCode, key, shiftKey: shift, metaKey: meta } = e
        const handler = userKeys[key] || userKeys[keyCode]
        if (handler) {
          handler(
            {
              keyCode,
              key,
              shift,
              meta
            },
            e
          )
        }
        if (onKeyDown) {
          onKeyDown(e)
        }
      }
    }
  }
}
