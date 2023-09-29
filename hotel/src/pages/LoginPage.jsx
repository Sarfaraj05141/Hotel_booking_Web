import { useContext, useState } from 'react'
import { Link,useNavigate } from 'react-router-dom';

import axios from 'axios'
import { UserContext } from '../UserContext';
export default function LoginPage(){
    const [email,setEmail]=useState('')
    const [password,setPassword]=useState('')
    const [redirect,setRedirect]=useState(false)
    const navigate = useNavigate();
    const {setUser}=useContext(UserContext)
    async function handleLoginSubmit(ev){
          ev.preventDefault()
          try {
            const {data}=await axios.post('/login', { email, password });
            setUser(data)
            alert('Successfully logged into your account');
            setRedirect(true)
          } catch (e) {
            alert('Login failed');
          }
    }
    if (redirect) {
        
        navigate('/');
      }

    return (
        <div className="mt-4 grow flex items-center justify-around">
            <div className="mb-32">
            <h1 className="text-4xl text-center mb-4">Login</h1>
            <form className="mt-2 max-w-md mx-auto border " onSubmit={handleLoginSubmit}>
                <input type='email' 
                       placeholder="your@email.com" 
                       value={email} 
                       onChange={ev=>setEmail(ev.target.value)}/>
                <input type='password' 
                       placeholder="password" 
                       value={password} 
                       onChange={ev=>setPassword(ev.target.value)}/>
                <button className='primary'>Login</button>
                <div className="text-center py-2 text-gray-500">
                    Don't have an account? <Link className='underline text-black' to={'/Register'} >Register Now</Link>  
                </div>
            </form>
            </div>
        </div>
    )
}