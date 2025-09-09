"""
Migration utilities for transitioning from in-memory storage to database.
Provides tools to migrate existing data and validate the database setup.
"""

import asyncio
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
import structlog

from config.database import get_database_manager
from services.database_service import get_database_service
from models.database import (
    UserModel, UserSessionModel, ProjectModel, 
    ChatSessionModel, WebhookEventModel
)

logger = structlog.get_logger(__name__)

class DataMigrator:
    """Migrates data from in-memory storage to database."""
    
    def __init__(self):
        self.db_service = get_database_service()
        self.db_manager = get_database_manager()
    
    async def migrate_users_from_memory(self, user_data: Dict[str, Dict[str, Any]]) -> int:
        """Migrate users from in-memory user_data dictionary."""
        migrated_count = 0
        
        try:
            for github_id, user_info in user_data.items():
                try:
                    # Check if user already exists
                    existing_user = await self.db_service.get_user_by_github_id(int(github_id))
                    if existing_user:
                        logger.info(f"User {github_id} already exists, skipping")
                        continue
                    
                    # Prepare user data for database
                    db_user_data = {
                        'github_id': int(github_id),
                        'login': user_info.get('login'),
                        'name': user_info.get('name'),
                        'email': user_info.get('email'),
                        'avatar_url': user_info.get('avatar_url'),
                        'bio': user_info.get('bio'),
                        'location': user_info.get('location'),
                        'company': user_info.get('company'),
                        'blog': user_info.get('blog'),
                        'twitter_username': user_info.get('twitter_username'),
                        'public_repos': user_info.get('public_repos', 0),
                        'followers': user_info.get('followers', 0),
                        'following': user_info.get('following', 0),
                        'role': 'user',
                        'is_active': True,
                        'last_login': datetime.now() if user_info.get('last_login') else None
                    }
                    
                    # Create user
                    await self.db_service.create_user(db_user_data)
                    migrated_count += 1
                    logger.info(f"Migrated user: {user_info.get('login')}")
                    
                except Exception as e:
                    logger.error(f"Failed to migrate user {github_id}", error=str(e))
                    continue
        
        except Exception as e:
            logger.error("Failed to migrate users", error=str(e))
            raise
        
        logger.info(f"Successfully migrated {migrated_count} users")
        return migrated_count
    
    async def migrate_sessions_from_memory(self, session_data: Dict[str, Dict[str, Any]]) -> int:
        """Migrate user sessions from in-memory session_data dictionary."""
        migrated_count = 0
        
        try:
            for session_id, session_info in session_data.items():
                try:
                    # Check if session already exists
                    existing_session = await self.db_service.get_user_session(session_id)
                    if existing_session:
                        logger.info(f"Session {session_id} already exists, skipping")
                        continue
                    
                    # Find the user in database
                    github_id = session_info.get('github_id')
                    user = await self.db_service.get_user_by_github_id(github_id)
                    if not user:
                        logger.warning(f"User {github_id} not found for session {session_id}, skipping")
                        continue
                    
                    # Prepare session data for database
                    db_session_data = {
                        'session_id': session_id,
                        'user_id': user.id,
                        'github_id': github_id,
                        'login': session_info.get('login'),
                        'name': session_info.get('name'),
                        'avatar_url': session_info.get('avatar_url'),
                        'access_token': session_info.get('access_token'),  # Already encrypted
                        'last_activity': session_info.get('last_activity', datetime.now()),
                        'is_active': True
                    }
                    
                    # Create session
                    await self.db_service.create_user_session(db_session_data)
                    migrated_count += 1
                    logger.info(f"Migrated session: {session_id}")
                    
                except Exception as e:
                    logger.error(f"Failed to migrate session {session_id}", error=str(e))
                    continue
        
        except Exception as e:
            logger.error("Failed to migrate sessions", error=str(e))
            raise
        
        logger.info(f"Successfully migrated {migrated_count} sessions")
        return migrated_count
    
    async def migrate_projects_from_memory(self, projects_data: Dict[str, Dict[str, Any]]) -> int:
        """Migrate projects from in-memory storage."""
        migrated_count = 0
        
        try:
            for project_id, project_info in projects_data.items():
                try:
                    # Check if project already exists
                    existing_project = await self.db_service.get_project(project_id)
                    if existing_project:
                        logger.info(f"Project {project_id} already exists, skipping")
                        continue
                    
                    # Find the creator user
                    created_by = project_info.get('created_by')
                    if not created_by:
                        logger.warning(f"No creator for project {project_id}, skipping")
                        continue
                    
                    # Prepare project data for database
                    db_project_data = {
                        'id': project_id,
                        'name': project_info.get('name'),
                        'description': project_info.get('description'),
                        'repository_url': project_info.get('repository_url'),
                        'full_name': project_info.get('full_name'),
                        'language': project_info.get('language'),
                        'stars': project_info.get('stars', 0),
                        'forks': project_info.get('forks', 0),
                        'issues': project_info.get('issues', 0),
                        'html_url': project_info.get('html_url'),
                        'created_by': created_by,
                        'is_beetle_project': project_info.get('is_beetle_project', False),
                        'settings': project_info.get('settings', {}),
                        'analytics': project_info.get('analytics', {}),
                        'recent_activity': project_info.get('recent_activity')
                    }
                    
                    # Create project
                    await self.db_service.create_project(db_project_data)
                    migrated_count += 1
                    logger.info(f"Migrated project: {project_info.get('name')}")
                    
                except Exception as e:
                    logger.error(f"Failed to migrate project {project_id}", error=str(e))
                    continue
        
        except Exception as e:
            logger.error("Failed to migrate projects", error=str(e))
            raise
        
        logger.info(f"Successfully migrated {migrated_count} projects")
        return migrated_count
    
    async def export_current_memory_data(self) -> Dict[str, Any]:
        """Export current in-memory data for backup before migration."""
        try:
            # Import current in-memory storage
            from utils.auth_utils import user_data, user_sessions
            from utils.project_utils import ProjectDatabase
            from core.session_manager import get_session_manager
            
            exported_data = {
                'users': dict(user_data),
                'sessions': dict(user_sessions),
                'timestamp': datetime.now().isoformat(),
                'version': '1.0'
            }
            
            # Export projects if available
            try:
                project_db = ProjectDatabase()
                if hasattr(project_db, 'projects'):
                    exported_data['projects'] = dict(project_db.projects)
            except Exception as e:
                logger.warning("Could not export projects", error=str(e))
                exported_data['projects'] = {}
            
            # Export chat sessions if available
            try:
                session_manager = get_session_manager()
                if hasattr(session_manager, 'sessions'):
                    exported_data['chat_sessions'] = {
                        session_id: session.to_dict() 
                        for session_id, session in session_manager.sessions.items()
                    }
            except Exception as e:
                logger.warning("Could not export chat sessions", error=str(e))
                exported_data['chat_sessions'] = {}
            
            return exported_data
            
        except Exception as e:
            logger.error("Failed to export current data", error=str(e))
            raise
    
    async def validate_migration(self) -> Dict[str, Any]:
        """Validate that the database migration was successful."""
        try:
            validation_results = {
                'database_health': await self.db_service.health_check(),
                'database_stats': await self.db_service.get_database_stats(),
                'timestamp': datetime.now().isoformat()
            }
            
            # Check if we can perform basic operations
            try:
                # Test user operations
                test_user_data = {
                    'github_id': 999999999,
                    'login': 'test_migration_user',
                    'name': 'Migration Test User',
                    'email': 'test@migration.com',
                    'avatar_url': 'https://example.com/avatar.png'
                }
                
                # Create test user
                test_user = await self.db_service.create_user(test_user_data)
                
                # Retrieve test user
                retrieved_user = await self.db_service.get_user_by_github_id(999999999)
                
                # Clean up test user
                # Note: You'd need to implement delete_user method in database service
                
                validation_results['user_operations'] = 'passed'
                
            except Exception as e:
                validation_results['user_operations'] = f'failed: {str(e)}'
            
            return validation_results
            
        except Exception as e:
            logger.error("Validation failed", error=str(e))
            return {
                'status': 'failed',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

async def run_migration(backup_file: Optional[str] = None) -> Dict[str, Any]:
    """Run complete migration from in-memory to database storage."""
    logger.info("Starting data migration from in-memory to database")
    
    migrator = DataMigrator()
    results = {
        'started_at': datetime.now().isoformat(),
        'users_migrated': 0,
        'sessions_migrated': 0,
        'projects_migrated': 0,
        'errors': []
    }
    
    try:
        # Export current data as backup
        if backup_file:
            try:
                exported_data = await migrator.export_current_memory_data()
                with open(backup_file, 'w') as f:
                    json.dump(exported_data, f, indent=2, default=str)
                logger.info(f"Exported current data to {backup_file}")
            except Exception as e:
                logger.error(f"Failed to export backup", error=str(e))
                results['errors'].append(f"Backup export failed: {str(e)}")
        
        # Import current in-memory data
        try:
            from utils.auth_utils import user_data, user_sessions
            
            # Migrate users
            if user_data:
                results['users_migrated'] = await migrator.migrate_users_from_memory(user_data)
            
            # Migrate sessions
            if user_sessions:
                results['sessions_migrated'] = await migrator.migrate_sessions_from_memory(user_sessions)
                
        except Exception as e:
            logger.error("Failed to migrate auth data", error=str(e))
            results['errors'].append(f"Auth migration failed: {str(e)}")
        
        # Migrate projects
        try:
            from utils.project_utils import ProjectDatabase
            project_db = ProjectDatabase()
            if hasattr(project_db, 'projects') and project_db.projects:
                results['projects_migrated'] = await migrator.migrate_projects_from_memory(project_db.projects)
        except Exception as e:
            logger.error("Failed to migrate projects", error=str(e))
            results['errors'].append(f"Project migration failed: {str(e)}")
        
        # Validate migration
        validation_results = await migrator.validate_migration()
        results['validation'] = validation_results
        
        results['completed_at'] = datetime.now().isoformat()
        results['success'] = len(results['errors']) == 0
        
        logger.info("Migration completed", results=results)
        return results
        
    except Exception as e:
        logger.error("Migration failed", error=str(e))
        results['errors'].append(f"Migration failed: {str(e)}")
        results['success'] = False
        results['completed_at'] = datetime.now().isoformat()
        return results

def get_migration_status() -> Dict[str, Any]:
    """Get current migration status and recommendations."""
    try:
        # Check if database is configured
        from config.database import get_database_settings
        db_settings = get_database_settings()
        
        # Check if in-memory data exists
        try:
            from utils.auth_utils import user_data, user_sessions
            has_memory_data = bool(user_data or user_sessions)
        except:
            has_memory_data = False
        
        return {
            'database_configured': True,
            'database_provider': db_settings.effective_database_provider,
            'has_memory_data': has_memory_data,
            'migration_needed': has_memory_data,
            'recommendations': [
                "Run migration to preserve existing data" if has_memory_data else "No migration needed",
                "Create backup before migration" if has_memory_data else "Ready to use database",
                f"Current provider: {db_settings.effective_database_provider}"
            ]
        }
        
    except Exception as e:
        return {
            'database_configured': False,
            'error': str(e),
            'recommendations': [
                "Configure database settings in .env file",
                "Install database dependencies",
                "Initialize database connection"
            ]
        }

if __name__ == "__main__":
    # CLI interface for migration
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "status":
        status = get_migration_status()
        # print(json.dumps(status, indent=2))
    elif len(sys.argv) > 1 and sys.argv[1] == "migrate":
        backup_file = sys.argv[2] if len(sys.argv) > 2 else "migration_backup.json"
        results = asyncio.run(run_migration(backup_file))
        # print(json.dumps(results, indent=2))
    else:
        pass
        # print("Usage:")
        # print("  python migration_utils.py status    - Check migration status")
        # print("  python migration_utils.py migrate [backup_file] - Run migration")

