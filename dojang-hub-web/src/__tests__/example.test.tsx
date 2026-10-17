import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

function HeaderExample({ title }: { title: string }) {
  return <h1>{title}</h1>;
}

describe('Frontend Test Pipeline', () => {
  it('renders correctly and passes basic assertions', () => {
    render(<HeaderExample title="SKAIHUB Platform" />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('SKAIHUB Platform');
  });
});
