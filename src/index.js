import { useState, useEffect, useRef, useMemo } from "react";

const defaultFilterFn = (options, searchValue) => {
  return options
    .filter(option =>
      option.value.toLowerCase().includes(searchValue.toLowerCase())
    )
    .sort((a, b) => {
      return a.value.toLowerCase().indexOf(searchValue.toLowerCase());
    });
};

export default function useSelect({
  multi,
  options,
  value,
  onChange,
  scrollToIndex = () => {},
  shiftAmount = 5,
  filterFn = defaultFilterFn,
  optionsRef: userOptionsRef
}) {
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, _sethighlightedIndex] = useState(0);
  const inputRef = useRef();

  if (multi && !Array.isArray(value)) {
    console.warn(
      `useSelect's 'multi' option cannot be used without an array value!`
    );
  }

  let selectedOption = useMemo(
    () => {
      if (!multi) {
        return options.find(d => d.value === value);
      } else {
        return value.map(val => options.find(d => d.value === val));
      }
    },
    [value]
  );

  if (multi) {
    options = options.filter(d => !value.includes(d.value));
  }

  options = searchValue ? filterFn(options, searchValue) : options;

  const highlightedOption = options[highlightedIndex];

  useClickOutsideRef(
    isOpen,
    () => {
      setIsOpen(false);
    },
    userOptionsRef
  );

  const sethighlightedIndex = updater =>
    _sethighlightedIndex(old =>
      Math.min(Math.max(0, updater(old)), options.length - 1)
    );

  const selectOption = option => {
    if (!multi) {
      onChange(option.value);
    } else if (!value.includes(option.value)) {
      onChange([...value, option.value], option.value);
    }

    if (!multi) {
      setIsOpen(false);
    } else {
      setSearchValue("");
    }
  };

  const removeValue = newValue => {
    onChange(value.filter(d => d !== newValue));
  };

  const handleSearchValueChange = e => {
    setSearchValue(e.target.value);
    setIsOpen(true);
  };

  const handleSearchClick = () => {
    setSearchValue("");
    setIsOpen(true);
  };

  const handleSearchFocus = () => handleSearchClick();

  const highlightOption = option => {
    sethighlightedIndex(old => {
      const index = options.indexOf(option);
      if (index > -1) {
        return index;
      }
      return old;
    });
  };

  const getKeyProps = useKeys({
    ArrowUp: ({ shift }, e) => {
      e.preventDefault();
      const amount = shift ? shiftAmount - 1 : 1;
      setIsOpen(true);
      sethighlightedIndex(old => old - amount);
    },
    ArrowDown: ({ shift }, e) => {
      e.preventDefault();
      const amount = shift ? shiftAmount - 1 : 1;
      setIsOpen(true);
      sethighlightedIndex(old => old + amount);
    },
    Enter: () => {
      selectOption(highlightedOption);
    },
    Escape: () => {
      setIsOpen(false);
    },
    Tab: () => {
      setIsOpen(false);
    },
    Backspace: () => {
      if (!multi) {
        return;
      }
      removeValue([...value].reverse()[0]);
    }
  });

  const getInputProps = ({
    refKey = "ref",
    ref,
    onChange,
    onFocus,
    onClick
  } = {}) => {
    return getKeyProps({
      [refKey]: el => {
        inputRef.current = el;
        if (ref) {
          ref.current = el;
        }
      },
      value: isOpen || !selectedOption ? searchValue : selectedOption.label,
      onChange: e => {
        handleSearchValueChange(e);
        if (onChange) {
          onChange(e);
        }
      },
      onFocus: e => {
        handleSearchFocus(e);
        if (onFocus) {
          onFocus(e);
        }
      },
      onClick: e => {
        handleSearchClick(e);
        if (onClick) {
          onClick(e);
        }
      }
    });
  };

  const getOptionProps = ({ option, onClick, onMouseEnter, ...rest } = {}) => {
    if (!option) {
      throw new Error(
        `'useSelect.getOptionProps' requires an option prop, eg. 'getOptionProps({option: currentOption})'`
      );
    }
    return {
      key: option.value,
      ...rest,
      onClick: e => {
        selectOption(option);
        if (onClick) {
          onClick(e);
        }
      },
      onMouseEnter: e => {
        highlightOption(option);
        if (onMouseEnter) {
          onMouseEnter(e);
        }
      }
    };
  };

  // When searching, activate the first option
  useEffect(
    () => {
      sethighlightedIndex(() => 0);
    },
    [searchValue]
  );

  // When we open and close the options, set the highlightedIndex to 0
  useEffect(
    () => {
      sethighlightedIndex(() => 0);
    },
    [isOpen]
  );

  // When the highlightedIndex changes, scroll to that item
  useEffect(
    () => {
      scrollToIndex(highlightedIndex);
    },
    [highlightedIndex]
  );

  // When the selectedOption changes, set the search value to its value
  useEffect(
    () => {
      if (selectedOption) {
        setSearchValue(selectedOption.value);
      }
    },
    [selectedOption]
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  });

  return {
    visibleOptions: options,
    selectedOption,
    highlightedOption,
    selectOption,
    getInputProps,
    isOpen,
    searchValue,
    highlightOption,
    getOptionProps
  };
}

function useClickOutsideRef(enable, fn, userRef) {
  const localRef = useRef();
  const elRef = userRef || localRef;

  const handle = e => {
    const isTouch = e.type === "touchstart";
    if (e.type === "click" && isTouch) {
      return;
    }
    const el = elRef.current;
    if (el && !el.contains(e.target)) fn(e);
  };

  useEffect(() => {
    if (enable) {
      document.addEventListener("touchstart", handle, true);
      document.addEventListener("click", handle, true);
    }

    return () => {
      document.removeEventListener("touchstart", handle, true);
      document.removeEventListener("click", handle, true);
    };
  });
}

const useKeys = userKeys => {
  return ({ onKeyDown, ...rest } = {}) => {
    return {
      ...rest,
      tabIndex: "1",
      onKeyDown: e => {
        e.persist();
        const { keyCode, key, shiftKey: shift } = e;
        const handler = userKeys[key] || userKeys[keyCode];
        if (handler) {
          handler(
            {
              keyCode,
              key,
              shift
            },
            e
          );
        }
        if (onKeyDown) {
          onKeyDown(e);
        }
      }
    };
  };
};
