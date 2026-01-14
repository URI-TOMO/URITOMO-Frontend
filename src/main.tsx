import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App' // App.tsx의 경로가 src/app/App.tsx 이므로
import './styles/index.css' // 스타일 파일 경로 확인 (src/styles/index.css)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)