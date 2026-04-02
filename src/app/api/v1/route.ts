import { NextResponse } from 'next/server';

export async function GET() {
  const apiDocs = {
    name: '公众号文章采集 API',
    version: '1.0.0',
    description: '提供微信公众号文章采集、下载、导出等功能的 RESTful API',
    authentication: {
      type: 'auth_key',
      description: '在请求参数中传递 auth_key 或在请求头中设置 x-auth-key',
      header: 'x-auth-key',
      param: 'auth_key',
    },
    endpoints: [
      {
        path: '/api/v1/authkey',
        method: 'GET',
        description: '验证 auth_key 是否有效',
        params: {
          auth_key: { type: 'string', required: true, description: '认证密钥' },
        },
        response: {
          code: 0,
          data: 'your_auth_key',
          nickname: '用户昵称',
          avatar: '头像URL',
        },
      },
      {
        path: '/api/v1/account',
        method: 'GET',
        description: '搜索公众号',
        params: {
          auth_key: { type: 'string', required: true, description: '认证密钥' },
          keyword: { type: 'string', required: true, description: '搜索关键词' },
          begin: { type: 'number', required: false, default: 0, description: '起始位置' },
          size: { type: 'number', required: false, default: 5, description: '返回数量' },
        },
        response: {
          base_resp: { ret: 0, err_msg: '' },
          total: 10,
          list: [
            {
              fakeid: '公众号ID',
              nickname: '公众号名称',
              alias: '微信号',
              round_head_img: '头像URL',
              signature: '简介',
            },
          ],
        },
      },
      {
        path: '/api/v1/article',
        method: 'GET',
        description: '获取公众号文章列表',
        params: {
          auth_key: { type: 'string', required: true, description: '认证密钥' },
          fakeid: { type: 'string', required: true, description: '公众号ID' },
          keyword: { type: 'string', required: false, description: '搜索关键词' },
          begin: { type: 'number', required: false, default: 0, description: '起始位置' },
          size: { type: 'number', required: false, default: 5, description: '返回数量' },
        },
        response: {
          base_resp: { ret: 0, err_msg: '' },
          total: 100,
          articles: [
            {
              aid: '文章ID',
              title: '文章标题',
              link: '文章链接',
              cover: '封面图',
              create_time: 1700000000,
              author_name: '作者',
            },
          ],
        },
      },
      {
        path: '/api/v1/download',
        method: 'GET',
        description: '下载文章内容',
        params: {
          url: { type: 'string', required: true, description: '文章链接 (URL编码)' },
          format: { type: 'string', required: false, default: 'html', description: '导出格式: html, markdown, text, json' },
        },
        response: {
          type: 'file',
          description: '返回文件内容',
        },
      },
      {
        path: '/api/article-download',
        method: 'GET',
        description: '下载文章 (内部接口)',
        params: {
          action: { type: 'string', required: true, description: '操作类型: download, batch' },
          url: { type: 'string', required: true, description: '文章链接' },
          format: { type: 'string', required: false, default: 'html', description: '导出格式' },
        },
      },
      {
        path: '/api/article-export',
        method: 'GET/POST',
        description: '导出文章为 Excel/Word',
        params: {
          format: { type: 'string', required: true, description: '导出格式: xlsx, docx' },
          articles: { type: 'array', required: false, description: '文章列表 (POST时使用)' },
        },
      },
      {
        path: '/api/album',
        method: 'GET',
        description: '获取合集信息',
        params: {
          action: { type: 'string', required: true, description: '操作类型: get, list' },
          album_id: { type: 'string', required: true, description: '合集ID' },
          auth_key: { type: 'string', required: false, description: '认证密钥' },
        },
      },
      {
        path: '/api/comment',
        method: 'GET',
        description: '获取文章评论',
        params: {
          action: { type: 'string', required: true, description: '操作类型: get, config' },
          url: { type: 'string', required: false, description: '文章链接' },
          biz: { type: 'string', required: false, description: '公众号biz参数' },
        },
      },
    ],
    usage: {
      example: {
        search_account: 'curl "http://localhost:3000/api/v1/account?auth_key=YOUR_KEY&keyword=测试"',
        get_articles: 'curl "http://localhost:3000/api/v1/article?auth_key=YOUR_KEY&fakeid=xxx"',
        download: 'curl "http://localhost:3000/api/v1/download?url=https%3A%2F%2Fmp.weixin.qq.com%2Fs%2Fxxx&format=markdown"',
      },
    },
  };

  return NextResponse.json(apiDocs, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
