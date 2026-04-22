// CreateWorkbench 组件样式

export const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    width: '100%',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
  },
  workflowSteps: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '24px',
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  stepActive: {
    backgroundColor: '#3b82f6',
    color: '#fff',
  },
  stepCompleted: {
    backgroundColor: '#10b981',
    color: '#fff',
  },
  stepPending: {
    backgroundColor: '#f1f5f9',
    color: '#64748b',
  },
  stepArrow: {
    color: '#cbd5e1',
    fontSize: '14px',
    flexShrink: 0,
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '24px',
  },
  mainContentSingle: {
    display: 'block',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    marginBottom: '16px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  inputGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    border: '1px solid #3b82f6',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  sourceTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  sourceTab: {
    flex: 1,
    padding: '12px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
  },
  sourceTabActive: {
    border: '2px solid #3b82f6',
    backgroundColor: '#eff6ff',
  },
  sourceTabTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
  },
  sourceTabDesc: {
    fontSize: '12px',
    color: '#64748b',
  },
  button: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonSecondary: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    color: '#3b82f6',
    border: '1px solid #3b82f6',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px',
  },
  titleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  titleItem: {
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  titleItemSelected: {
    border: '2px solid #3b82f6',
    backgroundColor: '#eff6ff',
  },
  titleText: {
    fontSize: '14px',
    color: '#1e293b',
    lineHeight: '1.5',
  },
  titleType: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    marginTop: '8px',
  },
  typeBenefit: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  typePain: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  typeTrend: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  contentEditor: {
    width: '100%',
    minHeight: '300px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.8',
    resize: 'vertical',
    outline: 'none',
  },
  previewContent: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.8',
    whiteSpace: 'pre-wrap',
    maxHeight: '400px',
    overflowY: 'auto',
  },
  aiCheckResult: {
    marginTop: '16px',
  },
  scoreDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  scoreCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '700',
  },
  scoreLow: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  scoreMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  scoreHigh: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },
  issuesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  issueItem: {
    padding: '12px',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#991b1b',
  },
  suggestionItem: {
    padding: '12px',
    backgroundColor: '#f0fdf4',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#166534',
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: '#fff',
    padding: '32px 48px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  loadingSpinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#1e293b',
  },
  errorAlert: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#991b1b',
    fontSize: '14px',
    marginBottom: '16px',
  },
  styleChips: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  styleChip: {
    padding: '8px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    backgroundColor: '#fff',
  },
  styleChipActive: {
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: '1px solid #8b5cf6',
  },
  configCard: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  configRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  configLabel: {
    fontSize: '13px',
    color: '#64748b',
  },
  configValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1e293b',
  },
  doneCard: {
    textAlign: 'center',
    padding: '48px',
  },
  doneIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  doneTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  doneDesc: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px',
  },
};

// 辅助函数
export function getStepStyle(currentStep: string, step: string, baseStyle: React.CSSProperties) {
  const steps = ['input', 'title', 'content', 'polish', 'images', 'publish', 'done'];
  const currentIndex = steps.indexOf(currentStep);
  const stepIndex = steps.indexOf(step);
  
  if (stepIndex < currentIndex) return { ...baseStyle, ...styles.stepCompleted };
  if (stepIndex === currentIndex) return { ...baseStyle, ...styles.stepActive };
  return { ...baseStyle, ...styles.stepPending };
}

export function getScoreColor(score: number) {
  if (score <= 30) return styles.scoreLow;
  if (score <= 60) return styles.scoreMedium;
  return styles.scoreHigh;
}

export function getTitleTypeLabel(type: string) {
  switch (type) {
    case 'benefit': return '利益结果型';
    case 'pain': return '场景痛点型';
    case 'trend': return '新机会趋势型';
    default: return '';
  }
}

export function getTitleTypeStyle(type: string) {
  switch (type) {
    case 'benefit': return styles.typeBenefit;
    case 'pain': return styles.typePain;
    case 'trend': return styles.typeTrend;
    default: return {};
  }
}
