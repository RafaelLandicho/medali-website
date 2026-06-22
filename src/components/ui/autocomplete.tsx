"use client";

import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { allIllnesses } from "@/db/illnessDb";

// Simulated API call

const fetchSuggestions = async (query: string): Promise<string[]> => {
  return allIllnesses
    .filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);
};
interface AutoCompleteProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}

export default function Autocomplete({
  value = "",
  placeholder,
  onChange,
}: AutoCompleteProps) {
  const [query, setQuery] = useState(value);
  const [debouncedQuery] = useDebounce(query, 300);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const fetchSuggestionsCallback = useCallback(async (q: string) => {
    if (q.trim() === "") {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const results = await fetchSuggestions(q);
    setSuggestions(results);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (debouncedQuery && isFocused) {
      fetchSuggestionsCallback(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery, fetchSuggestionsCallback, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    onChange?.(newValue);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      setQuery(suggestions[selectedIndex]);
      onChange?.(suggestions[selectedIndex]);
      setSuggestions([]);
      setSelectedIndex(-1);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onChange?.(suggestion);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setSuggestions([]);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className=" w-full ">
      <div className="w-full relative ">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pr-10"
          aria-label="Search input"
          aria-autocomplete="list"
          aria-controls="suggestions-list"
          aria-expanded={suggestions.length > 0}
        />
      </div>

      {isLoading && isFocused && (
        <div
          className="absolute z-10 mt-2 rounded-md border bg-background p-2 shadow-sm"
          aria-live="polite"
        >
          Loading...
        </div>
      )}

      {suggestions.length > 0 && !isLoading && isFocused && (
        <ul
          id="suggestions-list"
          className="absolute !z-99999 w-full mt-1 rounded-md border bg-background shadow-sm"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              className={`cursor-pointer px-4 py-2 hover:bg-muted ${
                index === selectedIndex ? "bg-muted" : ""
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
