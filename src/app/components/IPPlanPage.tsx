'use client';

import React, { useState, useEffect } from 'react';

interface IPPlan {
  id?: number;
  name: string;
  industry: string;
  industryAnalysis: Record<string, unknown> | null;
  accountName: string;
  accountAvatar: string;
  accountBio: string;
  accountStyle: string;
  personaName: string;
  personaTraits: string[] | null;
  personaStory: string;
  personaVoice: string;
  executionPlan: Record<string, unknown> | null;
  contentCalendar: Record<string, unknown>[] | null;
  milestones: Record<string, unknown>[] | null;
  monetizationPath: Record<string, unknown> | null;
  revenueModel: Record<string, unknown> | null;
  pricingStrategy: Record<string, unknown> | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

type StepType = 1 | 2 | 3 | 4 | 5;

const INDUSTRY_OPTIONS = [
  '职场成长', '理财投资', '健康养生', '教育培训', '情感心理',
  '美食烹饪', '旅行出游', '时尚穿搭', '母婴育儿', '科技数码',
  '房产家居', '法律咨询', '宠物', '文化艺术', '运动健身',
];

const STEPS = [
  { step: 1, title: '选择行业', icon: '🎯' },
  { step: 2, title: '账号包装', icon: '🎨' },
  { step: 3, title: '人设定制', icon: '👤' },
  { step: 4, title: '执行计划', icon: '📋' },
  { step: 5, title: '变现路径', icon: '💰' },
];

function IPPlanPage() {
  const [currentStep, setCurrentStep] = useState<StepType>(1);
  const [plans, setPlans] = useState<IPPlan[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IPPlan>({
    name: '',
    industry: '',
    industryAnalysis: null,
    accountName: '',
    accountAvatar: '',
    accountBio: '',
    accountStyle: '',
    personaName: '',
    personaTraits: [],
    personaStory: '',
    personaVoice: '',
    executionPlan: null,
    contentCalendar: null,
    milestones: null,
    monetizationPath: null,
    revenueModel: null,
    pricingStrategy: null,
    status: 'active',
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/ip-plans?action=list');
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('加载IP方案失败:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        action: editingPlanId ? 'update' : 'create',
        ...(editingPlanId ? { id: editingPlanId } : {}),
      };

      const res = await fetch('/api/ip-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        await loadPlans();
        setShowWizard(false);
        setEditingPlanId(null);
        resetForm();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存IP方案失败:', error);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个IP方案吗？')) return;
    try {
      const res = await fetch('/api/ip-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        await loadPlans();
      }
    } catch (error) {
      console.error('删除IP方案失败:', error);
    }
  };

  const handleEdit = (plan: IPPlan) => {
    setFormData(plan);
    setEditingPlanId(plan.id || null);
    setShowWizard(true);
    setCurrentStep(1);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      industry: '',
      industryAnalysis: null,
      accountName: '',
      accountAvatar: '',
      accountBio: '',
      accountStyle: '',
      personaName: '',
      personaTraits: [],
      personaStory: '',
      personaVoice: '',
      executionPlan: null,
      contentCalendar: null,
      milestones: null,
      monetizationPath: null,
      revenueModel: null,
      pricingStrategy: null,
      status: 'active',
    });
  };

  const startNewPlan = () => {
    resetForm();
    setEditingPlanId(null);
    setShowWizard(true);
    setCurrentStep(1);
  };

  const updateField = (field: keyof IPPlan, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 1: return !!formData.industry && !!formData.name;
      case 2: return !!formData.accountName;
      case 3: return !!formData.personaName;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s.step}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '24px',
              backgroundColor: currentStep === s.step ? '#E8652D' : currentStep > s.step ? '#f0fdf4' : '#f9fafb',
              border: `1px solid ${currentStep === s.step ? '#E8652D' : currentStep > s.step ? '#10b981' : '#e5e7eb'}`,
              transition: 'all 0.3s',
            }}
            onClick={() => {
              if (s.step < currentStep) setCurrentStep(s.step as StepType);
            }}
          >
            <span style={{ fontSize: '16px' }}>{s.icon}</span>
            <span style={{
              fontSize: '13px',
              fontWeight: 500,
              color: currentStep === s.step ? '#fff' : currentStep > s.step ? '#10b981' : '#6b7280',
            }}>{s.title}</span>
            {currentStep > s.step && <span style={{ color: '#10b981', fontSize: '14px' }}>✓</span>}
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              width: '24px',
              height: '2px',
              backgroundColor: currentStep > s.step ? '#10b981' : '#e5e7eb',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>🎯 选择行业与定位</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>选择你想要深耕的行业领域，这是IP方案的基础</p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>方案名称 *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => updateField('name', e.target.value)}
          placeholder="例如：职场成长IP方案"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '12px' }}>选择行业 *</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {INDUSTRY_OPTIONS.map(ind => (
            <button
              key={ind}
              onClick={() => updateField('industry', ind)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: `1px solid ${formData.industry === ind ? '#E8652D' : '#d1d5db'}`,
                backgroundColor: formData.industry === ind ? '#E8652D' : '#fff',
                color: formData.industry === ind ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>行业分析（选填）</label>
        <textarea
          value={formData.industryAnalysis?.description as string || ''}
          onChange={e => updateField('industryAnalysis', { ...formData.industryAnalysis, description: e.target.value })}
          placeholder="描述你对该行业的理解、目标用户群体、市场机会等..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>🎨 账号包装</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>设计你的公众号账号形象，让用户一眼记住你</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>账号名称 *</label>
          <input
            type="text"
            value={formData.accountName}
            onChange={e => updateField('accountName', e.target.value)}
            placeholder="例如：职场老张"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>头像描述</label>
          <input
            type="text"
            value={formData.accountAvatar}
            onChange={e => updateField('accountAvatar', e.target.value)}
            placeholder="例如：专业商务形象照"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>账号简介</label>
        <textarea
          value={formData.accountBio}
          onChange={e => updateField('accountBio', e.target.value)}
          placeholder="一句话介绍你的账号定位和价值主张..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>账号风格</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['专业严谨', '轻松幽默', '温暖治愈', '犀利直白', '学术深度', '故事叙事'].map(style => (
            <button
              key={style}
              onClick={() => updateField('accountStyle', style)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: `1px solid ${formData.accountStyle === style ? '#E8652D' : '#d1d5db'}`,
                backgroundColor: formData.accountStyle === style ? '#E8652D' : '#fff',
                color: formData.accountStyle === style ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>👤 人设定制</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>打造独特的人设IP，让读者产生信任和共鸣</p>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>人设名称 *</label>
        <input
          type="text"
          value={formData.personaName}
          onChange={e => updateField('personaName', e.target.value)}
          placeholder="例如：10年职场老兵"
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>人设标签</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['行业专家', '实践者', '过来人', '研究者', '观察者', '教练', '创业者', '老师'].map(tag => {
            const isSelected = (formData.personaTraits || []).includes(tag);
            return (
              <button
                key={tag}
                onClick={() => {
                  const traits = (formData.personaTraits || []) as string[];
                  updateField('personaTraits', isSelected ? traits.filter(t => t !== tag) : [...traits, tag]);
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: `1px solid ${isSelected ? '#E8652D' : '#d1d5db'}`,
                  backgroundColor: isSelected ? '#E8652D' : '#fff',
                  color: isSelected ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>人设故事</label>
        <textarea
          value={formData.personaStory}
          onChange={e => updateField('personaStory', e.target.value)}
          placeholder="描述你的背景故事、经历和转折点，让读者了解你的来路..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>语言风格</label>
        <textarea
          value={formData.personaVoice}
          onChange={e => updateField('personaVoice', e.target.value)}
          placeholder="描述你的说话方式、用词习惯、表达风格..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>📋 执行计划</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>制定内容发布节奏和阶段性目标</p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>发布频率</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {['每日1篇', '每周3-4篇', '每周2篇', '每周1篇'].map(freq => (
            <button
              key={freq}
              onClick={() => updateField('executionPlan', { ...formData.executionPlan, frequency: freq })}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: `1px solid ${(formData.executionPlan as Record<string, unknown>)?.frequency === freq ? '#E8652D' : '#d1d5db'}`,
                backgroundColor: (formData.executionPlan as Record<string, unknown>)?.frequency === freq ? '#E8652D' : '#fff',
                color: (formData.executionPlan as Record<string, unknown>)?.frequency === freq ? '#fff' : '#374151',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s',
              }}
            >
              {freq}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>内容方向</label>
        <textarea
          value={(formData.executionPlan as Record<string, unknown>)?.contentDirection as string || ''}
          onChange={e => updateField('executionPlan', { ...formData.executionPlan, contentDirection: e.target.value })}
          placeholder="描述你的主要内容方向和选题范围..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>阶段目标</label>
        <textarea
          value={(formData.executionPlan as Record<string, unknown>)?.phaseGoal as string || ''}
          onChange={e => updateField('executionPlan', { ...formData.executionPlan, phaseGoal: e.target.value })}
          placeholder="例如：第1个月积累30篇基础内容，第2-3个月开始引流..."
          rows={4}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>关键里程碑</label>
        <textarea
          value={(formData.milestones as Record<string, unknown>[])?.map(m => m.title).join('\n') || ''}
          onChange={e => {
            const lines = e.target.value.split('\n').filter(l => l.trim());
            updateField('milestones', lines.map((title, i) => ({ title, order: i + 1 })));
          }}
          placeholder="每行一个里程碑，例如：&#10;粉丝达到1000&#10;发布第50篇文章&#10;获得第一个付费用户"
          rows={4}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>💰 变现路径</h3>
      <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>规划你的商业变现模式和定价策略</p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>变现方式</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {['知识付费', '社群会员', '1对1咨询', '课程培训', '广告合作', '电商带货', '品牌代言', '企业服务'].map(path => {
            const selected = (formData.monetizationPath as Record<string, unknown>)?.methods as string[] || [];
            const isSelected = selected.includes(path);
            return (
              <button
                key={path}
                onClick={() => {
                  const methods = isSelected ? selected.filter(m => m !== path) : [...selected, path];
                  updateField('monetizationPath', { ...formData.monetizationPath, methods });
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: `1px solid ${isSelected ? '#E8652D' : '#d1d5db'}`,
                  backgroundColor: isSelected ? '#E8652D' : '#fff',
                  color: isSelected ? '#fff' : '#374151',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.2s',
                }}
              >
                {path}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>收入模型</label>
        <textarea
          value={(formData.revenueModel as Record<string, unknown>)?.description as string || ''}
          onChange={e => updateField('revenueModel', { ...formData.revenueModel, description: e.target.value })}
          placeholder="描述你的收入来源和预期收入结构..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>定价策略</label>
        <textarea
          value={(formData.pricingStrategy as Record<string, unknown>)?.description as string || ''}
          onChange={e => updateField('pricingStrategy', { ...formData.pricingStrategy, description: e.target.value })}
          placeholder="描述你的产品/服务定价思路和策略..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px 14px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );

  const renderWizard = () => (
    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937' }}>
          {editingPlanId ? '编辑IP方案' : '创建IP方案'}
        </h2>
        <button
          onClick={() => { setShowWizard(false); setEditingPlanId(null); resetForm(); }}
          style={{
            padding: '6px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#6b7280',
          }}
        >
          取消
        </button>
      </div>

      {renderStepIndicator()}

      <div style={{ minHeight: '300px' }}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1) as StepType)}
          disabled={currentStep === 1}
          style={{
            padding: '10px 24px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#fff',
            cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            color: currentStep === 1 ? '#9ca3af' : '#374151',
            opacity: currentStep === 1 ? 0.5 : 1,
          }}
        >
          上一步
        </button>

        {currentStep < 5 ? (
          <button
            onClick={() => setCurrentStep((currentStep + 1) as StepType)}
            disabled={!canGoNext()}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: canGoNext() ? '#E8652D' : '#d1d5db',
              cursor: canGoNext() ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              padding: '10px 32px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: loading ? '#d1d5db' : '#E8652D',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            {loading ? '保存中...' : editingPlanId ? '更新方案' : '保存方案'}
          </button>
        )}
      </div>
    </div>
  );

  const renderPlanList = () => (
    <div>
      {plans.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: '#fff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>还没有IP方案</h3>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
            通过5步向导创建你的第一个IP方案
          </p>
          <button
            onClick={startNewPlan}
            style={{
              padding: '10px 28px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#E8652D',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            创建IP方案
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {plans.map(plan => (
            <div
              key={plan.id}
              style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#E8652D';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>{plan.name}</h4>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                  }}>
                    {plan.industry || '未设置行业'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleEdit(plan)}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#374151',
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id!)}
                    style={{
                      padding: '4px 12px',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#dc2626',
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#6b7280' }}>
                {plan.accountName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎨</span>
                    <span>账号：{plan.accountName}</span>
                  </div>
                )}
                {plan.personaName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👤</span>
                    <span>人设：{plan.personaName}</span>
                  </div>
                )}
                {plan.personaTraits && (plan.personaTraits as string[]).length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>🏷️</span>
                    {(plan.personaTraits as string[]).map((t, i) => (
                      <span key={i} style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: '#f3f4f6',
                        fontSize: '11px',
                      }}>{t}</span>
                    ))}
                  </div>
                )}
                {(formData.monetizationPath as Record<string, unknown>)?.methods && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💰</span>
                    <span>变现：{((plan.monetizationPath as Record<string, unknown>)?.methods as string[] || []).join('、') || '未设置'}</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6', fontSize: '12px', color: '#9ca3af' }}>
                创建于 {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('zh-CN') : '未知'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '4px' }}>IP方案</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>5步打造你的公众号IP方案</p>
        </div>
        {!showWizard && (
          <button
            onClick={startNewPlan}
            style={{
              padding: '10px 24px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: '#E8652D',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            + 创建方案
          </button>
        )}
      </div>

      {showWizard ? renderWizard() : renderPlanList()}
    </div>
  );
}

export default IPPlanPage;
