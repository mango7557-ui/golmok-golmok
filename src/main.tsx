import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './styles.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:boolean}>{state={error:false};static getDerivedStateFromError(){return {error:true};}render(){return this.state.error?<div className="app-error"><h1>골목골목</h1><p>저장된 데모 데이터를 불러오지 못했습니다.<br/>Unable to load demo data.</p><button onClick={()=>{localStorage.removeItem('golmok-demo-v3');location.reload();}}>데모 초기화 · Reset demo</button></div>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<React.StrictMode><ErrorBoundary><App/></ErrorBoundary></React.StrictMode>);
