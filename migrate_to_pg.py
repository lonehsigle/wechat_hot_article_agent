#!/usr/bin/env python3
import sqlite3
import psycopg2
import json
import os
from datetime import datetime
from pathlib import Path

# Get the project root directory (where this script is located)
PROJECT_ROOT = Path(__file__).parent
SQLITE_PATH = PROJECT_ROOT / "data" / "content-monitor.db"

# PostgreSQL connection - use DATABASE_URL env var or construct from parts
def get_pg_connection():
    """Get PostgreSQL connection from environment or default"""
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        return psycopg2.connect(database_url)
    
    # Fallback to individual env vars
    pg_host = os.environ.get('PG_HOST', 'localhost')
    pg_port = os.environ.get('PG_PORT', '5432')
    pg_user = os.environ.get('PG_USER', 'content_monitor')
    pg_password = os.environ.get('PG_PASSWORD', 'content_monitor_pass')
    pg_db = os.environ.get('PG_DATABASE', 'content_monitor_db')
    
    return psycopg2.connect(
        host=pg_host,
        port=pg_port,
        user=pg_user,
        password=pg_password,
        database=pg_db
    )

def unix_to_timestamp(unix_ts):
    if unix_ts:
        return datetime.fromtimestamp(unix_ts)
    return datetime.now()

def migrate_table(sqlite_conn, pg_conn, table_name, transform_fn):
    """Migrate a table from SQLite to PostgreSQL with optional transformation"""
    sqlite_cur = sqlite_conn.cursor()
    pg_cur = pg_conn.cursor()
    
    # Get all rows from SQLite
    sqlite_cur.execute(f"SELECT * FROM {table_name}")
    columns = [desc[0] for desc in sqlite_cur.description]
    rows = sqlite_cur.fetchall()
    
    if not rows:
        print(f"  {table_name}: 0 rows, skipping")
        return
    
    for row in rows:
        data = dict(zip(columns, row))
        transformed = transform_fn(data)
        if transformed:
            placeholders = ', '.join(['%s'] * len(transformed))
            columns_str = ', '.join(transformed.keys())
            sql = f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})"
            try:
                pg_cur.execute(sql, list(transformed.values()))
            except Exception as e:
                print(f"  Error inserting into {table_name}: {e}")
                print(f"  Data: {transformed}")
    
    pg_conn.commit()
    print(f"  {table_name}: {len(rows)} rows migrated")

def transform_hot_topics(data):
    return {
        'platform': data['platform'],
        'title': data['title'],
        'description': data['description'],
        'url': data['url'],
        'hot_value': data.get('hot_value', 0),
        'rank': data.get('rank', 0),
        'category': data.get('category'),
        'tags': data.get('tags'),  # JSON string
        'trend_direction': data.get('trend_direction', 'stable'),
        'predicted_growth': data.get('predicted_growth', 0),
        'is_black_horse': bool(data.get('is_black_horse', 0)),
        'fetched_at': unix_to_timestamp(data.get('fetched_at')),
        'created_at': unix_to_timestamp(data.get('created_at')),
    }

def transform_material_library(data):
    return {
        'type': data['type'],
        'source': data['source'],
        'source_url': data.get('source_url'),
        'title': data['title'],
        'content': data['content'],
        'key_points': data.get('key_points'),
        'quotes': data.get('quotes'),
        'data_points': data.get('data_points'),
        'tags': data.get('tags'),
        'topic_id': data.get('topic_id'),
        'is_used': bool(data.get('is_used', 0)),
        'created_at': unix_to_timestamp(data.get('created_at')),
        'updated_at': unix_to_timestamp(data.get('updated_at')),
    }

def transform_wechat_accounts(data):
    return {
        'name': data['name'],
        'app_id': data.get('app_id', ''),
        'app_secret': data.get('app_secret', ''),
        'author_name': data.get('author_name', ''),
        'is_default': bool(data.get('is_default', 0)),
        'created_at': unix_to_timestamp(data.get('created_at')),
        'updated_at': unix_to_timestamp(data.get('updated_at')),
    }

def transform_llm_configs(data):
    return {
        'provider': data['provider'],
        'api_key': data['api_key'],
        'model': data['model'],
        'base_url': data.get('base_url'),
        'created_at': unix_to_timestamp(data.get('created_at')),
        'updated_at': unix_to_timestamp(data.get('updated_at')),
    }

def main():
    # Verify SQLite file exists
    if not SQLITE_PATH.exists():
        print(f"Error: SQLite database not found at {SQLITE_PATH}")
        print("Please run this script from the project root directory.")
        return
    
    print(f"SQLite path: {SQLITE_PATH}")
    print("Connecting to SQLite...")
    sqlite_conn = sqlite3.connect(str(SQLITE_PATH))
    
    print("Connecting to PostgreSQL...")
    pg_conn = get_pg_connection()
    
    print("\nMigrating tables...")
    
    migrate_table(sqlite_conn, pg_conn, 'hot_topics', transform_hot_topics)
    migrate_table(sqlite_conn, pg_conn, 'material_library', transform_material_library)
    migrate_table(sqlite_conn, pg_conn, 'wechat_accounts', transform_wechat_accounts)
    migrate_table(sqlite_conn, pg_conn, 'llm_configs', transform_llm_configs)
    
    print("\nClosing connections...")
    sqlite_conn.close()
    pg_conn.close()
    
    print("Done!")

if __name__ == "__main__":
    main()
