import { Routes, Route } from 'react-router-dom';
import Login from './login';

export default function Auth() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
    </Routes>
  );
}
