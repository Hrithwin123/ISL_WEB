import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Tras from "./pages/Tras"  
import Landing from "./pages/Landing"  
import Auth from "./pages/Auth"

export default function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />}></Route>
          <Route path="/auth" element={<Auth />}></Route>
          <Route path="/traslate" element={<Tras />}></Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
} 
    