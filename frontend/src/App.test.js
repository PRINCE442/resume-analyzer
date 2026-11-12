import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the upload screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /land your next role/i })).toBeInTheDocument();
  expect(screen.getByText(/drag & drop your resume/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /analyze resume/i })).toBeDisabled();
});
