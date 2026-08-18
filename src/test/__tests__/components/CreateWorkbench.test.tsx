import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CreateWorkbench from '@/app/components/CreateWorkbench';

describe('CreateWorkbench', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('cancels an in-flight stage without discarding the current input', async () => {
    let operationSignal: AbortSignal | undefined;
    global.fetch = vi.fn(async (input, init) => {
      if (String(input) === '/api/create-workshop') {
        operationSignal = init?.signal ?? undefined;
        return await new Promise<Response>((_, reject) => {
          operationSignal?.addEventListener(
            'abort',
            () => reject(operationSignal?.reason),
            { once: true }
          );
        });
      }

      const data = String(input).startsWith('/api/wechat-collect')
        ? { success: true, data: [] }
        : String(input) === '/api/wechat-accounts'
          ? { success: true, data: [] }
          : { success: true, data: [] };
      return new Response(JSON.stringify(data));
    });

    render(
      <CreateWorkbench
        llmConfig={{ provider: 'minimax', apiKey: 'configured', model: 'test-model' }}
        topics={[]}
        writingStyles={[]}
      />
    );

    const keywordInput = screen.getByPlaceholderText('如：AI编程、Claude Code、职场效率');
    fireEvent.change(keywordInput, { target: { value: 'AI写作' } });
    fireEvent.click(screen.getByRole('button', { name: /搜索热点话题/ }));

    const cancelButton = await screen.findByRole('button', { name: '取消并保留当前进度' });
    fireEvent.click(cancelButton);

    await waitFor(() => expect(operationSignal?.aborted).toBe(true));
    expect(await screen.findByText(/操作已取消，可从当前步骤重试/)).toBeInTheDocument();
    expect(keywordInput).toHaveValue('AI写作');
  });
});
