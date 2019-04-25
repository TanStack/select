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

export default function useSelect({
  multi,
  options,
  value,
  onChange,
  scrollToIndex = () => {},
  shiftAmount = 5,
  filterFn = defaultFilterFn,
  optionsRef = React.useRef()
}) {
  const [searchValue, setSearchValue] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  const [highlightedIndex, _sethighlightedIndex] = React.useState(0)
  const inputRef = React.useRef()

  if (!options || !Array.isArray(options)) {
    throw new Error('useSelect requires an array of options')
  }

  if (multi && !Array.isArray(value)) {
    console.warn(
      `useSelect's 'multi' option cannot be used without an array value!`
    )
  }

  let selectedOption = React.useMemo(() => {
    if (!multi) {
      return options.find(d => d.value === value)
    } else {
      return value.map(val => options.find(d => d.value === val))
    }
  }, [value])

  if (multi) {
    options = options.filter(d => !value.includes(d.value))
  }

  options = searchValue ? filterFn(options, searchValue) : options

  const highlightedOption = options[highlightedIndex]

  useClickOutsideRef(
    isOpen,
    () => {
      setIsOpen(false)
    },
    optionsRef
  )

  const sethighlightedIndex = updater =>
    _sethighlightedIndex(old =>
      Math.min(Math.max(0, updater(old)), options.length - 1)
    )

  const selectOption = option => {
    if (!multi) {
      onChange(option.value)
    } else if (!value.includes(option.value)) {
      onChange([...value, option.value], option.value)
    }

    if (!multi) {
      setIsOpen(false)
    } else {
      setSearchValue('')
    }
  }

  const removeValue = newValue => {
    onChange(value.filter(d => d !== newValue))
  }

  const handleSearchValueChange = e => {
    setSearchValue(e.target.value)
    setIsOpen(true)
  }

  const handleSearchClick = () => {
    setSearchValue('')
    setIsOpen(true)
  }

  const handleSearchFocus = () => handleSearchClick()

  const highlightOption = option => {
    sethighlightedIndex(old => {
      const index = options.indexOf(option)
      if (index > -1) {
        return index
      }
      return old
    })
  }

  const getKeyProps = useKeys({
    ArrowUp: ({ shift }, e) => {
      e.preventDefault()
      const amount = shift ? shiftAmount - 1 : 1
      setIsOpen(true)
      sethighlightedIndex(old => old - amount)
    },
    ArrowDown: ({ shift }, e) => {
      e.preventDefault()
      const amount = shift ? shiftAmount - 1 : 1
      setIsOpen(true)
      sethighlightedIndex(old => old + amount)
    },
    Enter: () => {
      selectOption(highlightedOption)
    },
    Escape: () => {
      setIsOpen(false)
    },
    Tab: () => {
      setIsOpen(false)
    },
    Backspace: () => {
      if (!multi) {
        return
      }
      removeValue([...value].reverse()[0])
    }
  })

  const getInputProps = ({
    refKey = 'ref',
    ref,
    onChange,
    onFocus,
    onClick
  } = {}) => {
    return getKeyProps({
      [refKey]: el => {
        inputRef.current = el
        if (ref) {
          ref.current = el
        }
      },
      value: isOpen || !selectedOption ? searchValue : selectedOption.label,
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
      }
    })
  }

  const getOptionProps = ({ option, onClick, onMouseEnter, ...rest } = {}) => {
    if (!option) {
      throw new Error(
        `'useSelect.getOptionProps' requires an option prop, eg. 'getOptionProps({option: currentOption})'`
      )
    }
    return {
      key: option.value,
      ...rest,
      onClick: e => {
        selectOption(option)
        if (onClick) {
          onClick(e)
        }
      },
      onMouseEnter: e => {
        highlightOption(option)
        if (onMouseEnter) {
          onMouseEnter(e)
        }
      }
    }
  }

  // When searching, activate the first option
  React.useEffect(() => {
    sethighlightedIndex(() => 0)
  }, [searchValue])

  // When we open and close the options, set the highlightedIndex to 0
  React.useEffect(() => {
    sethighlightedIndex(() => 0)
  }, [isOpen])

  // When the highlightedIndex changes, scroll to that item
  React.useEffect(() => {
    scrollToIndex(highlightedIndex)
  }, [highlightedIndex])

  // When the selectedOption changes, set the search value to its value
  React.useEffect(() => {
    if (selectedOption) {
      setSearchValue(selectedOption.value)
    }
  }, [selectedOption])

  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  })

  return {
    visibleOptions: options,
    selectedOption,
    highlightedOption,
    selectOption,
    getInputProps,
    isOpen,
    searchValue,
    highlightOption,
    getOptionProps,
    optionsRef
  }
}

function useClickOutsideRef(enable, fn, userRef) {
  const localRef = React.useRef()
  const elRef = userRef || localRef

  const handle = e => {
    const isTouch = e.type === 'touchstart'
    if (e.type === 'click' && isTouch) {
      return
    }
    const el = elRef.current
    if (el && !el.contains(e.target)) fn(e)
  }

  React.useEffect(() => {
    if (enable) {
      document.addEventListener('touchstart', handle, true)
      document.addEventListener('click', handle, true)
    }

    return () => {
      document.removeEventListener('touchstart', handle, true)
      document.removeEventListener('click', handle, true)
    }
  })
}

const useKeys = userKeys => {
  return ({ onKeyDown, ...rest } = {}) => {
    return {
      ...rest,
      tabIndex: '1',
      onKeyDown: e => {
        e.persist()
        const { keyCode, key, shiftKey: shift } = e
        const handler = userKeys[key] || userKeys[keyCode]
        if (handler) {
          handler(
            {
              keyCode,
              key,
              shift
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
