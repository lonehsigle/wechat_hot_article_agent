import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import LandingPage from '@/app/components/LandingPage';
import { mockRouter } from '@/test/setup';

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders landing page with logo', () => {
    render(<LandingPage />);
    const logos = screen.getAllByText('内容工作台');
    expect(logos.length).toBeGreaterThanOrEqual(1);
  });

  it('renders hero section', () => {
    render(<LandingPage />);
    expect(screen.getByText('智能内容创作平台')).toBeInTheDocument();
    expect(screen.getByText('让创作更高效')).toBeInTheDocument();
  });

  it('renders feature section', () => {
    render(<LandingPage />);
    expect(screen.getByText('核心功能')).toBeInTheDocument();
    expect(screen.getByText('热点聚合')).toBeInTheDocument();
    expect(screen.getByText('文章采集')).toBeInTheDocument();
    expect(screen.getByText('AI创作')).toBeInTheDocument();
    expect(screen.getByText('数据分析')).toBeInTheDocument();
    expect(screen.getByText('闭环优化')).toBeInTheDocument();
    expect(screen.getByText('选题分析')).toBeInTheDocument();
  });

  it('renders stats section', () => {
    render(<LandingPage />);
    expect(screen.getByText('10+')).toBeInTheDocument();
    expect(screen.getByText('100+')).toBeInTheDocument();
    expect(screen.getByText('AI')).toBeInTheDocument();
    expect(screen.getByText('24/7')).toBeInTheDocument();
  });

  it('renders about section', () => {
    render(<LandingPage />);
    expect(screen.getByText('为什么选择我们')).toBeInTheDocument();
    expect(screen.getByText('精准选题')).toBeInTheDocument();
    expect(screen.getByText('高效创作')).toBeInTheDocument();
    expect(screen.getByText('数据驱动')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<LandingPage />);
    expect(screen.getByText(/All rights reserved/)).toBeInTheDocument();
  });

  it('opens login modal when login button clicked', () => {
    render(<LandingPage />);
    const loginBtn = screen.getAllByRole('button', { name: /登录/i }).find(
      el => el.className.includes('btn-ghost')
    );
    expect(loginBtn).toBeDefined();
    if (loginBtn) fireEvent.click(loginBtn);
    expect(screen.getByText('用户名')).toBeInTheDocument();
  });

  it('opens register modal when register button clicked', () => {
    render(<LandingPage />);
    const buttons = screen.getAllByRole('button', { name: /免费注册/i });
    const registerBtn = buttons.find(el => !el.className.includes('cta-pulse'));
    expect(registerBtn).toBeDefined();
    if (registerBtn) fireEvent.click(registerBtn);
    expect(screen.getByText('注册账号')).toBeInTheDocument();
  });

  it('switches between login and register modes', () => {
    render(<LandingPage />);
    const loginBtn = screen.getAllByRole('button', { name: /登录/i }).find(
      el => el.className.includes('btn-ghost')
    );
    expect(loginBtn).toBeDefined();
    if (loginBtn) fireEvent.click(loginBtn);
    expect(screen.getByText('登录', { selector: 'h3' })).toBeInTheDocument();

    const switchToRegister = screen.getByText('立即注册');
    fireEvent.click(switchToRegister);
    expect(screen.getByText('注册账号')).toBeInTheDocument();

    const switchToLogin = screen.getByText('立即登录');
    fireEvent.click(switchToLogin);
    expect(screen.getByText('登录', { selector: 'h3' })).toBeInTheDocument();
  });

  it('closes modal when overlay clicked', () => {
    render(<LandingPage />);
    const loginBtn = screen.getAllByRole('button', { name: /登录/i }).find(
      el => el.className.includes('btn-ghost')
    );
    expect(loginBtn).toBeDefined();
    if (loginBtn) fireEvent.click(loginBtn);
    expect(screen.getByText('用户名')).toBeInTheDocument();

    const overlay = screen.getByText('登录', { selector: 'h3' }).closest('div')?.parentElement?.parentElement;
    if (overlay) fireEvent.click(overlay);
    expect(screen.queryByText('用户名')).not.toBeInTheDocument();
  });

  it('validates empty username on submit', async () => {
    global.fetch = vi.fn();
    render(<LandingPage />);
    const loginBtn = screen.getAllByRole('button', { name: /登录/i }).find(
      el => el.className.includes('btn-ghost')
    );
    expect(loginBtn).toBeDefined();
    if (loginBtn) fireEvent.click(loginBtn);

    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('请输入用户名')).toBeInTheDocument();
    });
  });

  it('validates email format in register mode', async () => {
    render(<LandingPage />);
    const buttons = screen.getAllByRole('button', { name: /免费注册/i });
    const registerBtn = buttons.find(el => !el.className.includes('cta-pulse'));
    expect(registerBtn).toBeDefined();
    if (registerBtn) fireEvent.click(registerBtn);

    const usernameInput = screen.getByPlaceholderText('请输入用户名');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    const emailInput = screen.getByPlaceholderText('请输入邮箱');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const passwordInput = screen.getByPlaceholderText('请输入密码');
    fireEvent.change(passwordInput, { target: { value: '123456' } });

    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    if (form) fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('请输入有效的邮箱地址')).toBeInTheDocument();
    });
  });

  it('submits login form successfully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ success: true }),
    } as Response);

    render(<LandingPage />);
    const loginBtn = screen.getAllByRole('button', { name: /登录/i }).find(
      el => el.className.includes('btn-ghost')
    );
    expect(loginBtn).toBeDefined();
    if (loginBtn) fireEvent.click(loginBtn);

    const usernameInput = screen.getByPlaceholderText('请输入用户名');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    const passwordInput = screen.getByPlaceholderText('请输入密码');
    fireEvent.change(passwordInput, { target: { value: '123456' } });

    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    if (form) {
      await act(async () => {
        fireEvent.submit(form);
      });
    }

    expect(global.fetch).toHaveBeenCalledWith('/api/auth', expect.any(Object));
    expect(mockRouter.push).toHaveBeenCalledWith('/app');
  });
});
