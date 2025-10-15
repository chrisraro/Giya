"use client"

import { useState, useEffect } from "react"

export default function TestPage() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <h1>Test Page</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}