import React from 'react';

const styles: Record<string, React.CSSProperties> = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f5f6f8',
  },
  sidebar: {
    width: '200px',
    backgroundColor: '#1e293b',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
  },
  logo: {
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  tabSection: {
    padding: '16px',
    flex: 1,
    overflowY: 'auto',
  },
  tabItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '10px',
    width: '100%',
    padding: '12px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '13px',
    transition: 'all 0.2s ease',
    marginBottom: '4px',
    whiteSpace: 'nowrap',
    position: 'relative',
    overflow: 'hidden',
  },
  tabItemActive: {
    backgroundColor: 'rgba(232,101,45,0.15)',
    color: '#E8652D',
    fontWeight: 500,
    position: 'relative',
    boxShadow: 'inset 2px 0 0 #E8652D',
  },
  tabIcon: {
    fontSize: '16px',
    minWidth: '16px',
    textAlign: 'center',
  },
  menuGroup: {
    marginTop: '16px',
    marginBottom: '8px',
  },
  menuGroupTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '8px 12px 4px',
  },
  subMenuItem: {
    padding: '10px 12px 10px 24px',
    fontSize: '13px',
  },
  sidebarFooter: {
    padding: '16px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  scheduleHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748b',
  },
  scheduleIcon: {
    fontSize: '14px',
  },
  main: {
    flex: 1,
    padding: '24px',
    marginLeft: '200px',
    transition: 'margin-left 0.3s ease',
    minHeight: '100vh',
  },
  mobileHeader: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '56px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 16px',
    zIndex: 1001,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileMenuBtn: {
    width: '40px',
    height: '40px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  mobileTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  categorySelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap',
  },
  categoryLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    whiteSpace: 'nowrap',
  },
  categoryChips: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  categoryChip: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  categoryChipActive: {
    backgroundColor: '#E8652D',
    border: '1px solid #E8652D',
    color: '#fff',
  },
  contentWrapper: {
    maxWidth: '1200px',
  },
  evaluationSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
  },
  sectionDesc: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '20px',
  },
  evaluationInput: {
    display: 'flex',
    gap: '12px',
  },
  evaluationInputField: {
    flex: 1,
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  evaluationBtn: {
    padding: '12px 24px',
    backgroundColor: '#E8652D',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  evaluationResult: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  scoreHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  scoreTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  totalScore: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
  },
  totalScoreValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#E8652D',
  },
  totalScoreLabel: {
    fontSize: '16px',
    color: '#64748b',
  },
  scoreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px',
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  scoreLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  scoreBar: {
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  scoreValue: {
    fontSize: '12px',
    color: '#64748b',
  },
  evaluationMeta: {
    display: 'flex',
    gap: '24px',
    marginBottom: '20px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  metaLabel: {
    fontSize: '13px',
    color: '#64748b',
  },
  metaValue: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1e293b',
  },
  painPointBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
  },
  suggestions: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  suggestionsTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '12px',
  },
  suggestionsList: {
    margin: 0,
    padding: '0 0 0 20px',
    listStyle: 'disc',
  },
  suggestionItem: {
    fontSize: '13px',
    color: '#374151',
    marginBottom: '8px',
    lineHeight: '1.5',
  },
  benchmarkSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  benchmarkGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  benchmarkCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  },
  benchmarkHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  benchmarkAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
  },
  benchmarkInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  benchmarkName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  benchmarkPlatform: {
    fontSize: '12px',
    color: '#64748b',
  },
  lowFollowerBadge: {
    padding: '4px 8px',
    backgroundColor: '#fef3c7',
    color: '#d97706',
    fontSize: '10px',
    fontWeight: '600',
    borderRadius: '4px',
  },
  benchmarkStats: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '8px',
  },
  benchmarkNote: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: '1.5',
    marginBottom: '12px',
  },
  benchmarkActions: {
    display: 'flex',
    gap: '8px',
  },
  benchmarkActionBtn: {
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#E8652D',
    cursor: 'pointer',
  },
  emptyBenchmark: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '40px',
    color: '#94a3b8',
    textAlign: 'center',
  },
  viralTitlesSection: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  viralTitlesTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  viralTitlesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '12px',
  },
  viralTitleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#fff',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  viralTitleContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  viralTitleText: {
    fontSize: '13px',
    color: '#1e293b',
    lineHeight: '1.4',
  },
  viralTitleStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#64748b',
  },
  useTitleBtn: {
    padding: '6px 12px',
    backgroundColor: '#E8652D',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  materialSection: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  materialTabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  materialTab: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  materialTabActive: {
    backgroundColor: '#E8652D',
    color: '#fff',
  },
  materialGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  materialCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  },
  materialHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  materialTypeBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: '600',
    color: '#fff',
  },
  materialSource: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  materialTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    margin: '0 0 8px 0',
    lineHeight: '1.4',
  },
  materialContent: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: '0 0 12px 0',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  materialPoints: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '12px',
  },
  materialPoint: {
    fontSize: '12px',
    color: '#475569',
    lineHeight: '1.4',
  },
  materialActions: {
    display: 'flex',
    gap: '8px',
  },
  materialActionBtn: {
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#E8652D',
    cursor: 'pointer',
  },
  emptyMaterial: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '40px',
    color: '#94a3b8',
    textAlign: 'center',
    gridColumn: '1 / -1',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: '24px 0',
  },
  toolbar: {
    marginBottom: '20px',
  },
  platformFilters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  platformChip: {
    padding: '8px 16px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  platformChipActive: {
    backgroundColor: '#1e293b',
    border: '1px solid #1e293b',
    color: '#fff',
  },
  dateTimeline: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    overflowX: 'auto',
    paddingBottom: '8px',
  },
  dateCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    minWidth: '80px',
  },
  dateCardActive: {
    border: '2px solid #E8652D',
    backgroundColor: '#eff6ff',
  },
  dateDay: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
  },
  dateMonth: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  dateCount: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#E8652D',
    color: '#fff',
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '10px',
  },
  contentArea: {},
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  contentTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
  },
  contentCount: {
    fontSize: '13px',
    color: '#64748b',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '16px',
  },
  contentCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e2e8f0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  platformTag: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
  },
  deepFetchBtn: {
    padding: '4px 10px',
    backgroundColor: '#8b5cf6',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
    lineHeight: '1.4',
  },
  cardMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '12px',
  },
  cardStats: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#64748b',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px',
  },
  emptyHint: {
    fontSize: '14px',
    color: '#6b7280',
  },
  analysisHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    gap: '16px',
  },
  reportTabs: {
    display: 'flex',
    gap: '12px',
  },
  reportTab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    minWidth: '120px',
  },
  reportTabActive: {
    border: '2px solid #8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  reportDate: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  reportPreview: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '4px',
  },
  generateBtn: {
    padding: '12px 24px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  reportContent: {},
  reportHeader: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
  },
  reportTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '12px',
  },
  reportSummary: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.7',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  insightCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
  },
  insightBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#fff',
    marginBottom: '12px',
  },
  insightText: {
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.6',
    margin: 0,
  },
  topicsSection: {},
  topicsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '16px',
  },
  topicsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '16px',
  },
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  topicTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px',
  },
  topicDesc: {
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.6',
    marginBottom: '16px',
  },
  topicMeta: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  topicMetaItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  topicMetaLabel: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#94a3b8',
  },
  topicMetaValue: {
    fontSize: '12px',
    color: '#374151',
    lineHeight: '1.5',
  },
  createArticleBtn: {
    marginTop: '16px',
    padding: '8px 16px',
    backgroundColor: '#8b5cf6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  settingsHeader: {
    marginBottom: '24px',
  },
  settingsPageTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px',
  },
  settingsTabNav: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '0',
  },
  settingsTab: {
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottomWidth: '3px',
    borderBottomStyle: 'solid',
    borderBottomColor: 'transparent',
    borderRadius: '0',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '-2px',
  },
  settingsTabActive: {
    color: '#E8652D',
    borderBottomColor: '#E8652D',
  },
  settingsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  configForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
    outline: 'none',
    backgroundColor: '#fff',
  },
  settingsCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  settingsCardTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1e293b',
  },
  addBtn: {
    padding: '6px 12px',
    backgroundColor: '#E8652D',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#374151',
  },
  creatorList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  creatorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  creatorAvatar: {
    fontSize: '18px',
  },
  creatorName: {
    flex: 1,
    fontSize: '13px',
    color: '#374151',
  },
  removeBtn: {
    width: '20px',
    height: '20px',
    backgroundColor: '#fee2e2',
    color: '#ef4444',
    border: 'none',
    borderRadius: '50%',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  scheduleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
  },
  scheduleLabel: {
    color: '#64748b',
  },
  scheduleValue: {
    color: '#374151',
    fontWeight: '500',
  },
  runBtn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  accountList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  accountItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  accountInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  accountName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  defaultBadge: {
    fontSize: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    marginLeft: '8px',
  },
  accountId: {
    fontSize: '11px',
    color: '#64748b',
  },
  accountActions: {
    display: 'flex',
    gap: '8px',
  },
  accountActionBtn: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#64748b',
    cursor: 'pointer',
  },
  emptyAccount: {
    padding: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748b',
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#E8652D',
  },
  createHeader: {
    marginBottom: '24px',
  },
  createTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '4px',
  },
  createSubtitle: {
    fontSize: '14px',
    color: '#64748b',
  },
  createConfigSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  createConfigCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  createConfigTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '12px',
  },
  configSelect: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
    outline: 'none',
  },
  accountInfoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '12px',
    fontSize: '12px',
    color: '#64748b',
  },
  llmProvider: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '4px',
  },
  llmModel: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '8px',
  },
  imageSourcesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '8px',
  },
  sourceTag: {
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#374151',
  },
  chainSelector: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  chainOption: {
    padding: '20px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    transition: 'all 0.2s',
  },
  chainOptionActive: {
    border: '2px solid #8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  chainRadioLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    cursor: 'pointer',
  },
  chainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  chainName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  chainDesc: {
    fontSize: '12px',
    color: '#64748b',
  },
  radio: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    marginTop: '2px',
  },
  chainConfig: {
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  configRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  configLabel: {
    width: '80px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  configInput: {
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    flex: 1,
  },
  styleButtons: {
    display: 'flex',
    gap: '8px',
  },
  styleBtn: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
  },
  styleBtnActive: {
    backgroundColor: '#8b5cf6',
    border: '1px solid #8b5cf6',
    color: '#fff',
  },
  chainInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '16px 20px',
    backgroundColor: '#eff6ff',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '14px',
    color: '#E8652D',
  },
  chainInfoIcon: {
    fontSize: '18px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionActions: {
    display: 'flex',
    gap: '8px',
  },
  selectAllBtn: {
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#64748b',
    cursor: 'pointer',
  },
  topicsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
  },
  topicSelectCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  topicSelectCardActive: {
    border: '2px solid #8b5cf6',
    backgroundColor: '#f5f3ff',
  },
  topicCheckbox: {
    width: '22px',
    height: '22px',
    border: '2px solid #e2e8f0',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkmark: {
    color: '#8b5cf6',
    fontWeight: '700',
    fontSize: '14px',
  },
  topicInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  topicSelectTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b',
  },
  topicSource: {
    fontSize: '12px',
    color: '#64748b',
  },
  batchActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    marginBottom: '24px',
  },
  selectedCount: {
    fontSize: '14px',
    color: '#64748b',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  draftsSection: {
    marginTop: '24px',
  },
  draftsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  draftCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
  },
  draftHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  draftTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e293b',
  },
  draftStatus: {
    fontSize: '12px',
    fontWeight: '500',
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  draftActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
  },
  previewBtn: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#374151',
    cursor: 'pointer',
  },
  uploadBtn: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: '500',
  },
  modalOverlay: {
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
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    width: '480px',
    maxWidth: '90vw',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e2e8f0',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  modalClose: {
    width: '32px',
    height: '32px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '20px',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: '24px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
  },
  formInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 20px',
    backgroundColor: '#E8652D',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#fff',
    cursor: 'pointer',
  },
};

export default styles;

export const mobileStyles = `
  /* ============================================
     Sidebar & Layout (Mobile)
     ============================================ */
  @media (max-width: 768px) {
    [data-mobile-sidebar] { display: none !important; }
    [data-mobile-header] { display: flex !important; }
    [data-mobile-main] { 
      margin-left: 0 !important; 
      padding: 16px !important;
      padding-top: 72px !important;
    }
    [data-mobile-card] { 
      padding: 16px !important;
    }
    [data-mobile-grid] {
      grid-template-columns: 1fr !important;
    }
    [data-mobile-grid-2] {
      grid-template-columns: repeat(2, 1fr) !important;
    }
    [data-mobile-flex-col] {
      flex-direction: column !important;
    }
    [data-mobile-full-width] {
      width: 100% !important;
    }
    [data-mobile-hide] {
      display: none !important;
    }
    [data-mobile-text-center] {
      text-align: center !important;
    }
    [data-mobile-font-sm] {
      font-size: 12px !important;
    }
    [data-mobile-p-sm] {
      padding: 8px 12px !important;
    }
    [data-mobile-gap-sm] {
      gap: 8px !important;
    }
    [data-mobile-scroll-x] {
      overflow-x: auto !important;
      -webkit-overflow-scrolling: touch !important;
    }
    [data-mobile-stack] {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    [data-mobile-no-border-radius] {
      border-radius: 0 !important;
    }
    [data-mobile-no-margin] {
      margin: 0 !important;
    }
    [data-mobile-compact] {
      padding: 8px !important;
      font-size: 12px !important;
    }
    [data-mobile-hero] {
      flex-direction: column !important;
      padding: 40px 20px !important;
      gap: 32px !important;
      min-height: auto !important;
    }
    [data-mobile-hero-title] {
      font-size: 32px !important;
    }
    [data-mobile-preview] {
      width: 100% !important;
      max-width: 360px !important;
      height: 240px !important;
    }
    [data-mobile-feature-grid] {
      grid-template-columns: 1fr !important;
    }
    [data-mobile-about-grid] {
      grid-template-columns: 1fr !important;
    }
    [data-mobile-stats-grid] {
      gap: 32px !important;
    }
    [data-mobile-nav] {
      padding: 12px 20px !important;
    }
    [data-mobile-nav-links] {
      display: none !important;
    }
    [data-mobile-footer] {
      flex-direction: column !important;
      text-align: center !important;
      gap: 12px !important;
    }
    [data-mobile-modal] {
      width: 100% !important;
      max-width: calc(100vw - 32px) !important;
    }
  }
  
  @media (max-width: 480px) {
    [data-mobile-main] { 
      padding: 12px !important;
      padding-top: 68px !important;
    }
    [data-mobile-card] { 
      padding: 12px !important;
    }
    [data-mobile-font-xs] {
      font-size: 11px !important;
    }
    [data-mobile-hero-title] {
      font-size: 26px !important;
    }
    [data-mobile-feature-grid] {
      grid-template-columns: 1fr !important;
    }
    [data-mobile-stats-grid] {
      gap: 20px !important;
    }
    [data-mobile-stat-value] {
      font-size: 32px !important;
    }
  }

  /* ============================================
     Sidebar Hover Effects (Global)
     ============================================ */
  [data-sidebar-item]:hover {
    background-color: rgba(255,255,255,0.08) !important;
    color: #e2e8f0 !important;
  }
  
  [data-sidebar-item-active] {
    background-color: rgba(232,101,45,0.15) !important;
    color: #E8652D !important;
    font-weight: 500 !important;
    box-shadow: inset 2px 0 0 #E8652D !important;
  }
  
  /* Smooth sidebar collapse */
  [data-sidebar] {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Main content margin transition */
  [data-main-content] {
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* ============================================
     Form & Input Focus States
     ============================================ */
  [data-input]:focus {
    border-color: #E8652D !important;
    box-shadow: 0 0 0 3px rgba(232, 101, 45, 0.15) !important;
    outline: none !important;
  }
  
  [data-btn-primary]:hover {
    background-color: #d4551f !important;
    box-shadow: 0 4px 14px rgba(232, 101, 45, 0.35) !important;
    transform: translateY(-1px) !important;
  }
  
  [data-btn-primary]:active {
    transform: translateY(0) !important;
  }
  
  [data-btn-secondary]:hover {
    border-color: #E8652D !important;
    color: #E8652D !important;
    background-color: #f5f6f8 !important;
  }
  
  /* Card hover effects */
  [data-card-hover]:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1) !important;
  }

  /* ============================================
     Scrollbar refinements for tables
     ============================================ */
  .table-scroll::-webkit-scrollbar {
    height: 4px;
  }
  
  .table-scroll::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .table-scroll::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 2px;
  }

  /* ============================================
     Quick action bar animation
     ============================================ */
  .quick-action-bar {
    transition: width 0.3s ease, opacity 0.3s ease;
  }
  
  [data-quick-card]:hover .quick-action-bar {
    width: 100% !important;
    opacity: 1 !important;
  }
`;