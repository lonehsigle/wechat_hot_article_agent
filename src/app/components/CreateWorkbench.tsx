'use client';

import React from 'react';
import { styles, getStepStyle } from './CreateWorkbench/styles';
import { useCreateWorkbenchState } from './CreateWorkbench/types';
import { InputStep } from './CreateWorkbench/steps/InputStep';
import { TitleStep } from './CreateWorkbench/steps/TitleStep';
import { ContentStep } from './CreateWorkbench/steps/ContentStep';
import { PolishStep } from './CreateWorkbench/steps/PolishStep';
import { ImagesStep } from './CreateWorkbench/steps/ImagesStep';
import { PublishStep } from './CreateWorkbench/steps/PublishStep';
import { DoneStep } from './CreateWorkbench/steps/DoneStep';
import type { CreateWorkbenchProps } from './CreateWorkbench/types';

export default function CreateWorkbench({ llmConfig, topics, writingStyles, onArticleCreated }: CreateWorkbenchProps) {
  const state = useCreateWorkbenchState();
  const s = state;

  const handleSearch = async () => {
    if (!s.keyword.trim()) return;
    s.setIsLoading(true);
    s.setLoadingMessage('正在搜索热点话题...');
    s.setError('');

    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'web-search', keyword: s.keyword }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      s.setSearchResults(data.content || '');
      s.setCurrentStep('title');
    } catch (err) {
      s.setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      s.setIsLoading(false);
      s.setLoadingMessage('');
    }
  };

  const handleGenerateTitles = async () => {
    s.setIsLoading(true);
    s.setLoadingMessage('正在生成标题...');
    s.setError('');

    try {
      const selectedArticles = s.inputSource === 'article' && s.selectedArticleIds.length > 0
        ? s.collectedArticles.filter(a => s.selectedArticleIds.includes(a.id))
        : [];
      const firstArticle = selectedArticles[0] || null;

      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-title',
          keyword: s.inputSource === 'keyword' ? s.keyword :
                  s.inputSource === 'topic' ? topics.find(t => t.id === s.selectedTopicId)?.title : '',
          content: s.inputSource === 'article' ? selectedArticles.map(a => a.content).join('\n\n---\n\n').substring(0, 5000) :
                   s.inputSource === 'keyword' ? s.searchResults : '',
          style: s.selectedStyleId,
          originalTitle: firstArticle?.title,
          readCount: firstArticle?.readCount,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      let titles = (data.titles || []).map((t: string, idx: number) => ({
        text: t,
        type: idx < 3 ? 'benefit' : idx < 6 ? 'pain' : 'trend' as const,
      }));

      if (firstArticle && firstArticle.readCount && firstArticle.readCount >= 10000) {
        const originalTitleOption = {
          text: firstArticle.title,
          type: 'benefit' as const,
          evaluation: {
            clickScore: 90,
            viralScore: 90,
            relevanceScore: 100,
            qualityScore: 90,
            totalScore: 92,
            analysis: '原标题已验证（阅读量过万），保留使用',
            highlights: ['已验证爆款', `阅读量${firstArticle.readCount.toLocaleString()}`],
          },
        };
        titles = titles.filter((t: typeof titles[0]) => t.text !== firstArticle.title);
        titles.unshift(originalTitleOption);
      }

      s.setTitleOptions(titles);
      if (titles.length > 1) {
        await evaluateTitleList(titles);
      }
    } catch (err) {
      s.setError(err instanceof Error ? err.message : '生成标题失败');
    } finally {
      s.setIsLoading(false);
      s.setLoadingMessage('');
    }
  };

  const evaluateTitleList = async (titles: typeof s.titleOptions) => {
    s.setEvaluatingTitles(true);
    s.setLoadingMessage('AI正在评估标题...');

    try {
      const originalTitle = s.inputSource === 'article' && s.selectedArticleIds.length > 0
        ? s.collectedArticles.find(a => a.id === s.selectedArticleIds[0])?.title
        : undefined;

      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'evaluate-title',
          titles: titles.map(t => t.text),
          originalTitle,
        }),
      });

      const data = await res.json();
      if (data.evaluations && Array.isArray(data.evaluations)) {
        const evaluatedTitles = titles.map(title => {
          const evaluation = data.evaluations.find((e: { title: string }) => e.title === title.text);
          return { ...title, evaluation: evaluation || undefined };
        });

        evaluatedTitles.sort((a, b) => (a.evaluation?.totalScore || 0) - (b.evaluation?.totalScore || 0));
        evaluatedTitles.reverse();

        s.setTitleOptions(evaluatedTitles);
        if (evaluatedTitles.length > 0 && evaluatedTitles[0].evaluation) {
          s.setSelectedTitle(evaluatedTitles[0].text);
        }
      }
    } catch (err) {
      console.error('Title evaluation failed:', err);
    } finally {
      s.setEvaluatingTitles(false);
      s.setLoadingMessage('');
    }
  };

  const handleGenerateContent = async () => {
    if (!s.selectedTitle) {
      s.setError('请先选择一个标题');
      return;
    }

    s.setIsLoading(true);
    s.setError('');

    try {
      const getKeyword = () => {
        if (s.inputSource === 'keyword') return s.keyword;
        if (s.inputSource === 'topic') return topics.find(t => t.id === s.selectedTopicId)?.title || '';
        if (s.inputSource === 'article' && s.selectedArticleIds.length > 0) return s.collectedArticles.find(a => a.id === s.selectedArticleIds[0])?.title || '';
        return '';
      };

      if (s.inputSource === 'article' && s.selectedArticleIds.length > 0) {
        const articles = s.collectedArticles.filter(a => s.selectedArticleIds.includes(a.id));
        const combinedContent = articles.map(a => a.content).join('\n\n---\n\n').substring(0, 5000);
        const firstArticle = articles[0];

        if (combinedContent) {
          s.setLoadingMessage('正在拆解原文框架（Step 4.2）...');

          const decomposeRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'decompose-article', content: combinedContent, title: firstArticle.title }),
          });
          const decomposeData = await decomposeRes.json();
          const articleContent = combinedContent.substring(0, 3000);

          s.setLoadingMessage('正在创作开头...');
          const openingRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate-opening', title: s.selectedTitle, keyword: getKeyword(), framework: decomposeData.framework, style: s.selectedStyleId, originalContent: articleContent }),
          });
          const openingData = await openingRes.json();
          s.setOpeningContent(openingData.opening || '');

          s.setLoadingMessage('正在创作正文（参考开头）...');
          const bodyRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate-body', title: s.selectedTitle, keyword: getKeyword(), framework: decomposeData.framework, articleType: decomposeData.articleType, style: s.selectedStyleId, originalContent: articleContent, opening: openingData.opening || '' }),
          });
          const bodyData = await bodyRes.json();
          s.setArticleContent(bodyData.body || '');

          s.setLoadingMessage('正在创作结尾（参考开头和正文）...');
          const endingRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'generate-ending', title: s.selectedTitle, body: bodyData.body || '', opening: openingData.opening || '', originalContent: articleContent }),
          });
          const endingResult = await endingRes.json();
          s.setEndingContent(endingResult.ending || '');

          s.setCurrentStep('content');
          return;
        }
      }

      s.setLoadingMessage('正在使用完整创作流程（并行请求）...');
      const articleContent = s.inputSource === 'article' && s.selectedArticleIds.length > 0
        ? s.collectedArticles.filter(a => s.selectedArticleIds.includes(a.id)).map(a => a.content).join('\n\n---\n\n').substring(0, 5000)
        : '';

      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-creation-workflow', keyword: getKeyword(), title: s.selectedTitle, style: s.selectedStyleId, originalContent: articleContent }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      s.setOpeningContent(data.opening || '');
      s.setArticleContent(data.body || '');
      s.setEndingContent(data.ending || '');
      s.setCurrentStep('content');
    } catch (err) {
      s.setError(err instanceof Error ? err.message : '生成文章失败');
    } finally {
      s.setIsLoading(false);
      s.setLoadingMessage('');
    }
  };

  const handleGenerateOpening = async () => {
    if (!s.selectedTitle) return;
    s.setIsLoading(true);
    s.setLoadingMessage('正在生成开头...');

    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-opening', title: s.selectedTitle, keyword: s.inputSource === 'keyword' ? s.keyword : '', style: s.selectedStyleId }),
      });
      const data = await res.json();
      s.setOpeningContent(data.opening || '');
    } catch (err) {
      console.error('Generate opening failed:', err);
    } finally {
      s.setIsLoading(false);
      s.setLoadingMessage('');
    }
  };

  const handleGenerateEnding = async () => {
    if (!s.selectedTitle || !s.articleContent) return;
    s.setIsLoading(true);
    s.setLoadingMessage('正在生成结尾（参考开头和正文）...');

    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-ending',
          title: s.selectedTitle,
          body: s.articleContent,
          opening: s.openingContent,
          originalContent: s.selectedArticleIds.length > 0 ? s.collectedArticles.find(a => a.id === s.selectedArticleIds[0])?.content?.substring(0, 3000) || '' : '',
        }),
      });
      const data = await res.json();
      s.setEndingContent(data.ending || '');
    } catch (err) {
      console.error('Generate ending failed:', err);
    } finally {
      s.setIsLoading(false);
      s.setLoadingMessage('');
    }
  };

  const handlePolish = async () => {
    const fullContent = `${s.openingContent}\n\n${s.articleContent}\n\n${s.endingContent}`.trim();
    if (!fullContent) {
      s.setError('请先生成文章内容');
      return;
    }

    s.setIsLoading(true);
    s.setLoadingMessage('正在进行润色优化...');
    s.setError('');

    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'polish-content', content: fullContent }),
      });
      const data = await res.json();
      if (data.content) {
        s.setPolishedContent(data.content);
        s.setAiCheckResult(data.aiCheckResult || null);
      } else {
        s.setPolishedContent(fullContent);
      }
      s.setCurrentStep('polish');
    } catch (err) {
      s.setError(err instanceof Error ? err.message : '润色优化失败');
    } finally {
      s.setIsLoading(false);
      s.setLoadingMessage('');
    }
  };

  const handleGenerateImages = async () => {
    const content = s.polishedContent || `${s.openingContent}\n\n${s.articleContent}\n\n${s.endingContent}`.trim();
    if (!content || !s.selectedTitle) {
      s.setError('请先完成文章创作');
      return;
    }

    s.setIsLoading(true);
    s.setLoadingMessage('正在生成配图（30%/60%/90%位置）...');
    s.setError('');

    try {
      const res = await fetch('/api/image-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-article-images', content, title: s.selectedTitle, imageCount: 3 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      s.setGeneratedImages(data.images || []);
      s.setCurrentStep('images');
    } catch (err) {
      s.setError(err instanceof Error ? err.message : '生成配图失败');
    } finally {
      s.setIsLoading(false);
      s.setLoadingMessage('');
    }
  };

  const handlePublish = async () => {
    const content = s.polishedContent || `${s.openingContent}\n\n${s.articleContent}\n\n${s.endingContent}`.trim();
    if (!content || !s.selectedTitle) {
      s.setError('请先完成文章创作');
      return;
    }
    if (!s.selectedAccountId) {
      s.setError('请选择发布账号');
      return;
    }

    s.setIsLoading(true);
    s.setLoadingMessage('正在保存改写内容...');
    s.setError('');

    try {
      const saveRes = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-rewrite', sourceArticleIds: s.selectedArticleIds.length > 0 ? s.selectedArticleIds : [], title: s.selectedTitle, content, style: s.selectedStyleId, wordCount: content.length, aiScore: s.aiCheckResult?.score }),
      });
      const saveData = await saveRes.json();
      if (!saveData.success) console.warn('保存改写内容失败:', saveData.error);

      s.setLoadingMessage('正在发布到微信草稿箱...');
      s.setPublishStatus('uploading');

      const selectedLayoutStyle = s.layoutStyles.find(st => String(st.id) === s.selectedLayoutId);
      const layoutStyleConfig = selectedLayoutStyle ? {
        headerStyle: selectedLayoutStyle.headerStyle,
        paragraphSpacing: selectedLayoutStyle.paragraphSpacing,
        listStyle: selectedLayoutStyle.listStyle,
        highlightStyle: selectedLayoutStyle.highlightStyle,
        emojiUsage: selectedLayoutStyle.emojiUsage,
        quoteStyle: selectedLayoutStyle.quoteStyle,
        imagePosition: selectedLayoutStyle.imagePosition,
        calloutStyle: selectedLayoutStyle.calloutStyle,
        colorScheme: selectedLayoutStyle.colorScheme,
        fontStyle: selectedLayoutStyle.fontStyle,
      } : null;

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish-with-images', accountId: parseInt(s.selectedAccountId), title: s.selectedTitle, content, images: s.generatedImages, layoutStyle: layoutStyleConfig }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      s.setPublishStatus('success');
      s.setPublishMessage('文章已成功发布到微信草稿箱！');
      s.setCurrentStep('publish');
    } catch (err) {
      s.setPublishStatus('error');
      s.setPublishMessage(err instanceof Error ? err.message : '发布失败');
      s.setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      s.setIsLoading(false);
      s.setLoadingMessage('');
    }
  };

  const handleSaveDraft = async () => {
    const content = s.polishedContent || `${s.openingContent}\n\n${s.articleContent}\n\n${s.endingContent}`.trim();
    if (!content || !s.selectedTitle) {
      s.setError('请先完成文章创作');
      return;
    }

    s.setIsLoading(true);
    s.setLoadingMessage('正在保存草稿...');
    s.setError('');

    try {
      const res = await fetch('/api/create-workshop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save-rewrite', sourceArticleIds: s.selectedArticleIds.length > 0 ? s.selectedArticleIds : [], title: s.selectedTitle, content, summary: content.substring(0, 200) + '...', style: s.selectedStyleId, wordCount: content.length, aiScore: s.aiCheckResult?.score }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      s.setPublishStatus('success');
      s.setPublishMessage('草稿已保存！可在"待发布管理"中查看和发布');
      s.setCurrentStep('publish');
    } catch (err) {
      s.setPublishStatus('error');
      s.setPublishMessage(err instanceof Error ? err.message : '保存失败');
      s.setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      s.setIsLoading(false);
      s.setLoadingMessage('');
    }
  };

  const handleOneClickPublish = async () => {
    if (s.selectedArticleIds.length === 0 || !s.selectedStyleId) {
      s.setError('请选择文章和写作风格');
      return;
    }

    s.setShowPublishModal(true);
    s.setPublishProgress([]);
    s.setPublishCurrentStep('');

    const addProgress = (message: string) => {
      s.setPublishProgress(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const articles = s.collectedArticles.filter(a => s.selectedArticleIds.includes(a.id));
    const totalArticles = articles.length;
    let successCount = 0;
    let failCount = 0;

    addProgress(`🚀 开始批量改写发布流程，共 ${totalArticles} 篇文章...`);

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const articleNum = i + 1;

      try {
        addProgress(`\n━━━ 📄 第 ${articleNum}/${totalArticles} 篇: ${article.title.substring(0, 25)}... ━━━`);

        const articleContent = article.content?.substring(0, 5000) || '';

        s.setPublishCurrentStep('generate-title');
        addProgress(`[第${articleNum}篇] 📝 正在生成标题...`);

        const titleRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate-title', content: articleContent, style: s.selectedStyleId, originalTitle: article.title, readCount: article.readCount }),
        });
        const titleData = await titleRes.json();
        let titles = titleData.titles || [];

        if (titles.length > 0) {
          addProgress(`[第${articleNum}篇] 📊 正在评估标题...`);
          const evalRes = await fetch('/api/create-workshop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'evaluate-title', titles, originalTitle: article.title }),
          });
          const evalData = await evalRes.json();
          if (evalData.evaluations && evalData.evaluations.length > 0) {
            evalData.evaluations.sort((a: { totalScore: number }, b: { totalScore: number }) => b.totalScore - a.totalScore);
            titles = evalData.evaluations.map((e: { title: string }) => e.title);
          }
        }

        const finalTitle = titles[0] || article.title || '未命名文章';
        addProgress(`[第${articleNum}篇] ✅ 选定标题: ${finalTitle.substring(0, 30)}...`);

        s.setPublishCurrentStep('generate-content');
        addProgress(`[第${articleNum}篇] ✍️ 正在拆解原文框架...`);

        const decomposeRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'decompose-article', content: articleContent, title: finalTitle }),
        });
        const decomposeData = await decomposeRes.json();

        addProgress(`[第${articleNum}篇] ✍️ 正在创作开头...`);
        const openingRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate-opening', title: finalTitle, keyword: article.title || '', framework: decomposeData.framework, style: s.selectedStyleId, originalContent: articleContent.substring(0, 3000) }),
        });
        const openingData = await openingRes.json();

        addProgress(`[第${articleNum}篇] ✍️ 正在创作正文...`);
        const bodyRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate-body', title: finalTitle, keyword: article.title || '', framework: decomposeData.framework, articleType: decomposeData.articleType, style: s.selectedStyleId, originalContent: articleContent.substring(0, 3000), opening: openingData.opening || '' }),
        });
        const bodyData = await bodyRes.json();

        addProgress(`[第${articleNum}篇] ✍️ 正在创作结尾...`);
        const endingRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate-ending', title: finalTitle, body: bodyData.body || '', opening: openingData.opening || '', originalContent: articleContent.substring(0, 3000) }),
        });
        const endingData = await endingRes.json();

        const fullContent = `${openingData.opening || ''}\n\n${bodyData.body || ''}\n\n${endingData.ending || ''}`.trim();

        s.setPublishCurrentStep('polish');
        addProgress(`[第${articleNum}篇] 🎨 正在进行AI检测和润色优化...`);

        const checkRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check-ai', content: fullContent }),
        });
        const aiResult = await checkRes.json();

        const polishRes = await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'polish-content', content: fullContent, aiCheckResult: aiResult }),
        });
        const polishData = await polishRes.json();

        s.setPublishCurrentStep('save');
        addProgress(`[第${articleNum}篇] 💾 正在保存到草稿箱...`);

        await fetch('/api/create-workshop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save-rewrite', sourceArticleIds: [article.id], title: finalTitle, content: polishData.content || fullContent, style: s.selectedStyleId, wordCount: (polishData.content || fullContent).length, aiScore: aiResult.score }),
        });

        successCount++;
        addProgress(`[第${articleNum}篇] ✅ 完成！`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '处理失败';
        addProgress(`[第${articleNum}篇] ❌ 失败: ${errorMsg}`);
        failCount++;
      }
    }

    addProgress(`\n━━━ 📊 批量处理完成 ━━━`);
    addProgress(`✅ 成功: ${successCount} 篇`);
    if (failCount > 0) addProgress(`❌ 失败: ${failCount} 篇`);

    s.setPublishCurrentStep('done');
    if (successCount > 0) addProgress(`🎉 全部完成！${successCount} 篇文章已保存到草稿箱`);
  };

  const handleComplete = () => {
    const finalContent = s.polishedContent || `${s.openingContent}\n\n${s.articleContent}\n\n${s.endingContent}`.trim();
    if (onArticleCreated && s.selectedTitle && finalContent) {
      onArticleCreated({ title: s.selectedTitle, content: finalContent });
    }
    s.setCurrentStep('done');
  };

  const handleReset = () => {
    s.setInputSource('keyword');
    s.setCurrentStep('input');
    s.setKeyword('');
    s.setSelectedTopicId('');
    s.setSelectedArticleIds([]);
    s.setSearchResults('');
    s.setTitleOptions([]);
    s.setSelectedTitle('');
    s.setArticleContent('');
    s.setOpeningContent('');
    s.setEndingContent('');
    s.setAiCheckResult(null);
    s.setPolishedContent('');
    s.setGeneratedImages([]);
    s.setPublishStatus('idle');
    s.setPublishMessage('');
    s.setError('');
  };

  const canProceedFromInput = () => {
    if (s.inputSource === 'keyword') return s.keyword.trim().length > 0;
    if (s.inputSource === 'topic') return s.selectedTopicId !== '';
    if (s.inputSource === 'article') return s.selectedArticleIds.length > 0;
    return false;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title} data-cw-title>✍️ 创作工作台</h2>
        <p style={styles.subtitle} data-cw-subtitle>一键式创作文章 · 从选题到发布的完整工作流</p>
      </div>

      <div style={styles.workflowSteps} data-cw-workflow-steps>
        {(['input', 'title', 'content', 'polish', 'images', 'publish', 'done'] as const).map((step, idx) => (
          <React.Fragment key={step}>
            {idx > 0 && <span style={styles.stepArrow} data-cw-step-arrow>→</span>}
            <div style={getStepStyle(s.currentStep, step, styles.stepItem)} data-cw-step-item>
              <span>{idx === 6 ? '✅' : `${idx + 1}️⃣`}</span>
              {['输入来源', '生成标题', '创作内容', '润色优化', '生成配图', '发布', '完成'][idx]}
            </div>
          </React.Fragment>
        ))}
      </div>

      {s.error && (
        <div style={styles.errorAlert}>
          ⚠️ {s.error}
        </div>
      )}

      {s.currentStep === 'input' && (
        <InputStep
          inputSource={s.inputSource}
          setInputSource={s.setInputSource}
          keyword={s.keyword}
          setKeyword={s.setKeyword}
          selectedTopicId={s.selectedTopicId}
          setSelectedTopicId={s.setSelectedTopicId}
          selectedArticleIds={s.selectedArticleIds}
          setSelectedArticleIds={s.setSelectedArticleIds}
          selectedStyleId={s.selectedStyleId}
          setSelectedStyleId={s.setSelectedStyleId}
          selectedLayoutId={s.selectedLayoutId}
          setSelectedLayoutId={s.setSelectedLayoutId}
          topics={topics}
          writingStyles={writingStyles}
          layoutStyles={s.layoutStyles}
          collectedArticles={s.collectedArticles}
          llmConfig={llmConfig}
          canProceedFromInput={canProceedFromInput}
          onSearch={handleSearch}
          onNextStep={() => s.setCurrentStep('title')}
          onOneClickPublish={handleOneClickPublish}
          isLoading={s.isLoading}
        />
      )}

      {s.currentStep === 'title' && (
        <TitleStep
          titleOptions={s.titleOptions}
          selectedTitle={s.selectedTitle}
          setSelectedTitle={s.setSelectedTitle}
          evaluatingTitles={s.evaluatingTitles}
          inputSource={s.inputSource}
          keyword={s.keyword}
          selectedTopicId={s.selectedTopicId}
          selectedArticleIds={s.selectedArticleIds}
          collectedArticles={s.collectedArticles}
          topics={topics}
          contentAnalysis={s.contentAnalysis}
          isLoading={s.isLoading}
          onGenerateTitles={handleGenerateTitles}
          onGenerateContent={handleGenerateContent}
        />
      )}

      {s.currentStep === 'content' && (
        <ContentStep
          openingContent={s.openingContent}
          setOpeningContent={s.setOpeningContent}
          articleContent={s.articleContent}
          setArticleContent={s.setArticleContent}
          endingContent={s.endingContent}
          setEndingContent={s.setEndingContent}
          selectedTitle={s.selectedTitle}
          isLoading={s.isLoading}
          onGenerateOpening={handleGenerateOpening}
          onGenerateEnding={handleGenerateEnding}
          onPolish={handlePolish}
          onBack={() => s.setCurrentStep('title')}
        />
      )}

      {s.currentStep === 'polish' && (
        <PolishStep
          aiCheckResult={s.aiCheckResult}
          polishedContent={s.polishedContent}
          setPolishedContent={s.setPolishedContent}
          openingContent={s.openingContent}
          articleContent={s.articleContent}
          endingContent={s.endingContent}
          selectedTitle={s.selectedTitle}
          generatedImages={s.generatedImages}
          isLoading={s.isLoading}
          onPolish={handlePolish}
          onGenerateImages={handleGenerateImages}
          onBack={() => s.setCurrentStep('content')}
        />
      )}

      {s.currentStep === 'images' && (
        <ImagesStep
          generatedImages={s.generatedImages}
          polishedContent={s.polishedContent}
          selectedTitle={s.selectedTitle}
          isLoading={s.isLoading}
          onGenerateImages={handleGenerateImages}
          onPublish={() => s.setCurrentStep('publish')}
          onBack={() => s.setCurrentStep('polish')}
        />
      )}

      {s.currentStep === 'publish' && (
        <PublishStep
          wechatAccounts={s.wechatAccounts}
          selectedAccountId={s.selectedAccountId}
          setSelectedAccountId={s.setSelectedAccountId}
          selectedTitle={s.selectedTitle}
          polishedContent={s.polishedContent}
          generatedImages={s.generatedImages}
          publishStatus={s.publishStatus}
          publishMessage={s.publishMessage}
          isLoading={s.isLoading}
          onPublish={handlePublish}
          onSaveDraft={handleSaveDraft}
          onComplete={handleComplete}
          onBack={() => s.setCurrentStep('images')}
        />
      )}

      {s.currentStep === 'done' && (
        <DoneStep
          selectedTitle={s.selectedTitle}
          polishedContent={s.polishedContent}
          generatedImages={s.generatedImages}
          onReset={handleReset}
        />
      )}

      {s.isLoading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingCard} data-cw-loading-card>
            <div style={styles.loadingSpinner}></div>
            <div style={styles.loadingText}>{s.loadingMessage}</div>
          </div>
        </div>
      )}

      {s.showPublishModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
            width: '90%', maxWidth: '500px', maxHeight: '80vh',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>⚡ 批量改写发布进度</h3>
              <button onClick={() => s.setShowPublishModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {['generate-title', 'generate-content', 'polish', 'save', 'done'].map((step, idx) => {
                const labels = ['生成标题', '创作内容', '润色优化', '保存草稿', '完成'];
                const isActive = s.publishCurrentStep === step;
                const isDone = ['generate-title', 'generate-content', 'polish', 'save', 'done'].indexOf(s.publishCurrentStep) > idx;
                return (
                  <div key={step} style={{
                    padding: '6px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: '500',
                    backgroundColor: isActive ? '#dbeafe' : isDone ? '#dcfce7' : '#f1f5f9',
                    color: isActive ? '#1d4ed8' : isDone ? '#166534' : '#64748b',
                  }}>
                    {isDone ? '✓' : `${idx + 1}.`} {labels[idx]}
                  </div>
                );
              })}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6' }}>
              {s.publishProgress.length === 0 ? (
                <div style={{ color: '#64748b', textAlign: 'center' }}>准备中...</div>
              ) : (
                s.publishProgress.map((log, idx) => <div key={idx} style={{ marginBottom: '4px', color: '#475569' }}>{log}</div>)
              )}
            </div>
            {s.publishCurrentStep === 'done' && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#dcfce7', borderRadius: '8px', textAlign: 'center', color: '#166534', fontWeight: '500' }}>🎉 发布成功！文章已保存到草稿箱</div>
            )}
            {s.publishCurrentStep === 'error' && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px', textAlign: 'center', color: '#991b1b', fontWeight: '500' }}>❌ 发布失败，请重试</div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          [data-cw-grid] { grid-template-columns: 1fr !important; }
          [data-cw-card] { padding: 16px !important; margin-bottom: 12px !important; }
          [data-cw-title] { font-size: 20px !important; margin-bottom: 6px !important; }
          [data-cw-subtitle] { font-size: 13px !important; }
          [data-cw-workflow-steps] { gap: 4px !important; padding: 8px !important; }
          [data-cw-step-item] { padding: 4px 8px !important; font-size: 11px !important; }
          [data-cw-step-arrow] { font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}
