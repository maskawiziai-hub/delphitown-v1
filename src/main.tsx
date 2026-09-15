import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// A type guard rather than a non-null assertion (ARCH-004): if #root is
// missing the failure should be a clear message, not "cannot read
// properties of null" from inside React.
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root not found in index.html')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
