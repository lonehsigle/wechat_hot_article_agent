import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountModal from '@/app/components/modals/AccountModal';

const mockAccount = {
  id: '1',
  name: 'Test Account',
  appId: 'app-id-123',
  appSecret: 'secret-123',
  authorName: 'Author',
  isDefault: false,
  targetAudience: 'Developers',
  readerPersona: 'Tech savvy',
  contentStyle: '专业深度',
  mainTopics: ['Tech', 'AI'],
  tonePreference: '正式严谨',
};

const mockAccounts = [mockAccount];

describe('AccountModal', () => {
  it('does not render when show is false', () => {
    const { container } = render(
      <AccountModal
        show={false}
        account={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
        wechatAccounts={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('does not render when account is null', () => {
    const { container } = render(
      <AccountModal
        show={true}
        account={null}
        onClose={vi.fn()}
        onSave={vi.fn()}
        wechatAccounts={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders edit modal with account data', () => {
    render(
      <AccountModal
        show={true}
        account={mockAccount}
        onClose={vi.fn()}
        onSave={vi.fn()}
        wechatAccounts={mockAccounts}
      />
    );
    expect(screen.getByText('编辑公众号账号')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Account')).toBeInTheDocument();
    expect(screen.getByDisplayValue('app-id-123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Author')).toBeInTheDocument();
  });

  it('renders new account modal when account not in list', () => {
    render(
      <AccountModal
        show={true}
        account={{ ...mockAccount, id: '999' }}
        onClose={vi.fn()}
        onSave={vi.fn()}
        wechatAccounts={mockAccounts}
      />
    );
    expect(screen.getByText('新增公众号账号')).toBeInTheDocument();
  });

  it('calls onClose when overlay clicked', () => {
    const onClose = vi.fn();
    render(
      <AccountModal
        show={true}
        account={mockAccount}
        onClose={onClose}
        onSave={vi.fn()}
        wechatAccounts={mockAccounts}
      />
    );
    const overlay = screen.getByText('编辑公众号账号').closest('div')?.parentElement?.parentElement;
    if (overlay) fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(
      <AccountModal
        show={true}
        account={mockAccount}
        onClose={onClose}
        onSave={vi.fn()}
        wechatAccounts={mockAccounts}
      />
    );
    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel button clicked', () => {
    const onClose = vi.fn();
    render(
      <AccountModal
        show={true}
        account={mockAccount}
        onClose={onClose}
        onSave={vi.fn()}
        wechatAccounts={mockAccounts}
      />
    );
    const cancelBtn = screen.getByText('取消');
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('updates name field on change', () => {
    render(
      <AccountModal
        show={true}
        account={mockAccount}
        onClose={vi.fn()}
        onSave={vi.fn()}
        wechatAccounts={mockAccounts}
      />
    );
    const nameInput = screen.getByDisplayValue('Test Account');
    fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
    expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
  });

  it('updates appId field on change', () => {
    render(
      <AccountModal
        show={true}
        account={mockAccount}
        onClose={vi.fn()}
        onSave={vi.fn()}
        wechatAccounts={mockAccounts}
      />
    );
    const input = screen.getByDisplayValue('app-id-123');
    fireEvent.change(input, { target: { value: 'new-app-id' } });
    expect(screen.getByDisplayValue('new-app-id')).toBeInTheDocument();
  });

  it('updates appSecret field on change', () => {
    render(
      <AccountModal
        show={true}
        account={mockAccount}
        onClose={vi.fn()}
        onSave={vi.fn()}
        wechatAccounts={mockAccounts}
      />
    );
    const input = screen.getByDisplayValue('secret-123');
    fireEvent.change(input, { target: { value: 'new-secret' } });
    expect(screen.getByDisplayValue('new-secret')).toBeInTheDocument();
  });

  it('calls onSave with updated data when save clicked', () => {
    const onSave = vi.fn();
    render(
      <AccountModal
        show={true}
        account={mockAccount}
        onClose={vi.fn()}
        onSave={onSave}
        wechatAccounts={mockAccounts}
      />
    );
    const saveBtn = screen.getByText('保存');
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledOnce();
    expect(onSave.mock.calls[0][0].name).toBe('Test Account');
  });

  it('renders all form fields', () => {
    render(
      <AccountModal
        show={true}
        account={mockAccount}
        onClose={vi.fn()}
        onSave={vi.fn()}
        wechatAccounts={mockAccounts}
      />
    );
    expect(screen.getByText('账号名称 *')).toBeInTheDocument();
    expect(screen.getByText('AppID')).toBeInTheDocument();
    expect(screen.getByText('AppSecret')).toBeInTheDocument();
    expect(screen.getByText('作者名称')).toBeInTheDocument();
    expect(screen.getByText('目标用户群体')).toBeInTheDocument();
    expect(screen.getByText('读者画像')).toBeInTheDocument();
    expect(screen.getByText('内容风格')).toBeInTheDocument();
    expect(screen.getByText('主要话题领域')).toBeInTheDocument();
    expect(screen.getByText('语言风格偏好')).toBeInTheDocument();
  });
});
