import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  const checkIsMobile = React.useCallback(() => {
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
  }, [])

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // We intentionally don't put this in effect dependencies to avoid re-binding
    const onChange = () => checkIsMobile()
    
    mql.addEventListener("change", onChange)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkIsMobile() // Set initial value during effect execution (will run after first paint)
    
    return () => mql.removeEventListener("change", onChange)
  }, [checkIsMobile])

  return !!isMobile
}
