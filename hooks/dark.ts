import { useEffect, useState } from "react";

export function useDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(isDark)

    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', event => {
        console.log(event)
        if (event.matches) {
          //dark mode
          setDark(true)
        } else {
          //light mode
          setDark(false)
        }
      })
  }, [])
  return dark
}
