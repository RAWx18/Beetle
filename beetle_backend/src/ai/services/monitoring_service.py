import logging
import time
import asyncio
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from collections import defaultdict, deque
import json
import psutil
import threading

logger = logging.getLogger(__name__)


class MonitoringService:
    """Monitoring service for system metrics and performance tracking"""
    
    def __init__(self, max_history_size: int = 1000):
        self.max_history_size = max_history_size
        self.metrics_history = defaultdict(lambda: deque(maxlen=max_history_size))
        self.performance_metrics = {}
        self.system_metrics = {}
        self.custom_metrics = {}
        self.alerts = []
        self.alert_handlers = []
        self.monitoring_enabled = True
        self._lock = threading.Lock()
        
        # Initialize system monitoring
        self._start_system_monitoring()
    
    def _start_system_monitoring(self):
        """Start system monitoring thread"""
        def monitor_system():
            while self.monitoring_enabled:
                try:
                    self._collect_system_metrics()
                    time.sleep(30)  # Collect every 30 seconds
                except Exception as e:
                    logger.error(f"Error in system monitoring: {e}")
        
        monitor_thread = threading.Thread(target=monitor_system, daemon=True)
        monitor_thread.start()
    
    def _collect_system_metrics(self):
        """Collect system metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used = memory.used
            memory_total = memory.total
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_used = disk.used
            disk_total = disk.total
            
            # Network metrics
            network = psutil.net_io_counters()
            bytes_sent = network.bytes_sent
            bytes_recv = network.bytes_recv
            
            # Process metrics
            process = psutil.Process()
            process_cpu_percent = process.cpu_percent()
            process_memory_percent = process.memory_percent()
            process_memory_info = process.memory_info()
            
            self.system_metrics = {
                "timestamp": datetime.utcnow().isoformat(),
                "cpu": {
                    "percent": cpu_percent,
                    "count": cpu_count,
                },
                "memory": {
                    "percent": memory_percent,
                    "used": memory_used,
                    "total": memory_total,
                    "available": memory.available,
                },
                "disk": {
                    "percent": disk_percent,
                    "used": disk_used,
                    "total": disk_total,
                    "free": disk.free,
                },
                "network": {
                    "bytes_sent": bytes_sent,
                    "bytes_recv": bytes_recv,
                },
                "process": {
                    "cpu_percent": process_cpu_percent,
                    "memory_percent": process_memory_percent,
                    "memory_rss": process_memory_info.rss,
                    "memory_vms": process_memory_info.vms,
                },
            }
            
            # Store in history
            self._store_metric("system", self.system_metrics)
            
        except Exception as e:
            logger.error(f"Error collecting system metrics: {e}")
    
    def record_metric(self, category: str, name: str, value: Any, metadata: Optional[Dict[str, Any]] = None):
        """Record a custom metric"""
        with self._lock:
            metric_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "category": category,
                "name": name,
                "value": value,
                "metadata": metadata or {},
            }
            
            # Store in history
            self._store_metric(f"{category}.{name}", metric_data)
            
            # Store current value
            if category not in self.custom_metrics:
                self.custom_metrics[category] = {}
            self.custom_metrics[category][name] = metric_data
    
    def record_performance_metric(self, operation: str, duration: float, success: bool = True, metadata: Optional[Dict[str, Any]] = None):
        """Record performance metric"""
        with self._lock:
            metric_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "operation": operation,
                "duration": duration,
                "success": success,
                "metadata": metadata or {},
            }
            
            # Store in history
            self._store_metric(f"performance.{operation}", metric_data)
            
            # Update performance metrics
            if operation not in self.performance_metrics:
                self.performance_metrics[operation] = {
                    "count": 0,
                    "total_duration": 0.0,
                    "success_count": 0,
                    "failure_count": 0,
                    "min_duration": float('inf'),
                    "max_duration": 0.0,
                    "avg_duration": 0.0,
                }
            
            perf_metrics = self.performance_metrics[operation]
            perf_metrics["count"] += 1
            perf_metrics["total_duration"] += duration
            perf_metrics["avg_duration"] = perf_metrics["total_duration"] / perf_metrics["count"]
            
            if success:
                perf_metrics["success_count"] += 1
            else:
                perf_metrics["failure_count"] += 1
            
            perf_metrics["min_duration"] = min(perf_metrics["min_duration"], duration)
            perf_metrics["max_duration"] = max(perf_metrics["max_duration"], duration)
    
    def _store_metric(self, key: str, data: Dict[str, Any]):
        """Store metric in history"""
        self.metrics_history[key].append(data)
    
    def get_metric_history(self, key: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get metric history"""
        with self._lock:
            history = list(self.metrics_history[key])
            if limit:
                history = history[-limit:]
            return history
    
    def get_current_metrics(self) -> Dict[str, Any]:
        """Get current metrics"""
        with self._lock:
            return {
                "system": self.system_metrics,
                "performance": self.performance_metrics,
                "custom": self.custom_metrics,
                "timestamp": datetime.utcnow().isoformat(),
            }
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Get performance summary"""
        with self._lock:
            summary = {}
            for operation, metrics in self.performance_metrics.items():
                summary[operation] = {
                    "total_operations": metrics["count"],
                    "success_rate": metrics["success_count"] / metrics["count"] if metrics["count"] > 0 else 0,
                    "avg_duration": metrics["avg_duration"],
                    "min_duration": metrics["min_duration"] if metrics["min_duration"] != float('inf') else 0,
                    "max_duration": metrics["max_duration"],
                    "total_duration": metrics["total_duration"],
                }
            return summary
    
    def add_alert_handler(self, handler: Callable[[Dict[str, Any]], None]):
        """Add alert handler"""
        self.alert_handlers.append(handler)
    
    def create_alert(self, alert_type: str, message: str, severity: str = "info", metadata: Optional[Dict[str, Any]] = None):
        """Create an alert"""
        alert = {
            "id": f"{alert_type}_{int(time.time())}",
            "type": alert_type,
            "message": message,
            "severity": severity,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {},
        }
        
        self.alerts.append(alert)
        
        # Call alert handlers
        for handler in self.alert_handlers:
            try:
                handler(alert)
            except Exception as e:
                logger.error(f"Error in alert handler: {e}")
        
        logger.warning(f"Alert: {alert_type} - {message}")
    
    def check_thresholds(self, thresholds: Dict[str, Dict[str, float]]):
        """Check metrics against thresholds and create alerts"""
        current_metrics = self.get_current_metrics()
        
        for metric_path, threshold_config in thresholds.items():
            try:
                # Navigate to metric value
                metric_parts = metric_path.split('.')
                metric_value = current_metrics
                for part in metric_parts:
                    metric_value = metric_value[part]
                
                # Check thresholds
                if "min" in threshold_config and metric_value < threshold_config["min"]:
                    self.create_alert(
                        "threshold_min",
                        f"Metric {metric_path} ({metric_value}) below minimum threshold ({threshold_config['min']})",
                        "warning",
                        {"metric_path": metric_path, "value": metric_value, "threshold": threshold_config["min"]}
                    )
                
                if "max" in threshold_config and metric_value > threshold_config["max"]:
                    self.create_alert(
                        "threshold_max",
                        f"Metric {metric_path} ({metric_value}) above maximum threshold ({threshold_config['max']})",
                        "warning",
                        {"metric_path": metric_path, "value": metric_value, "threshold": threshold_config["max"]}
                    )
                
            except (KeyError, TypeError) as e:
                logger.warning(f"Could not check threshold for {metric_path}: {e}")
    
    def get_alerts(self, severity: Optional[str] = None, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get alerts"""
        alerts = self.alerts
        
        if severity:
            alerts = [alert for alert in alerts if alert["severity"] == severity]
        
        if limit:
            alerts = alerts[-limit:]
        
        return alerts
    
    def clear_alerts(self, older_than: Optional[timedelta] = None):
        """Clear alerts"""
        if older_than:
            cutoff_time = datetime.utcnow() - older_than
            self.alerts = [
                alert for alert in self.alerts
                if datetime.fromisoformat(alert["timestamp"]) > cutoff_time
            ]
        else:
            self.alerts.clear()
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get system health status"""
        current_metrics = self.get_current_metrics()
        
        # Check system health
        system_health = "healthy"
        if current_metrics.get("system", {}).get("memory", {}).get("percent", 0) > 90:
            system_health = "warning"
        if current_metrics.get("system", {}).get("cpu", {}).get("percent", 0) > 90:
            system_health = "warning"
        if current_metrics.get("system", {}).get("disk", {}).get("percent", 0) > 90:
            system_health = "critical"
        
        # Check performance health
        performance_health = "healthy"
        for operation, metrics in current_metrics.get("performance", {}).items():
            if metrics.get("avg_duration", 0) > 5.0:  # 5 seconds threshold
                performance_health = "warning"
            if metrics.get("success_rate", 1.0) < 0.9:  # 90% success rate threshold
                performance_health = "critical"
        
        return {
            "overall_health": "healthy" if system_health == "healthy" and performance_health == "healthy" else "warning",
            "system_health": system_health,
            "performance_health": performance_health,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    def export_metrics(self, format: str = "json") -> str:
        """Export metrics in specified format"""
        current_metrics = self.get_current_metrics()
        
        if format.lower() == "json":
            return json.dumps(current_metrics, indent=2, default=str)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def import_metrics(self, metrics_data: str, format: str = "json"):
        """Import metrics from specified format"""
        if format.lower() == "json":
            data = json.loads(metrics_data)
            
            # Update current metrics
            with self._lock:
                if "system" in data:
                    self.system_metrics.update(data["system"])
                if "performance" in data:
                    self.performance_metrics.update(data["performance"])
                if "custom" in data:
                    self.custom_metrics.update(data["custom"])
        else:
            raise ValueError(f"Unsupported import format: {format}")
    
    def reset_metrics(self):
        """Reset all metrics"""
        with self._lock:
            self.metrics_history.clear()
            self.performance_metrics.clear()
            self.custom_metrics.clear()
            self.alerts.clear()
    
    def get_metrics_summary(self) -> Dict[str, Any]:
        """Get metrics summary"""
        current_metrics = self.get_current_metrics()
        
        summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "system": {
                "cpu_percent": current_metrics.get("system", {}).get("cpu", {}).get("percent", 0),
                "memory_percent": current_metrics.get("system", {}).get("memory", {}).get("percent", 0),
                "disk_percent": current_metrics.get("system", {}).get("disk", {}).get("percent", 0),
            },
            "performance": {
                "total_operations": sum(
                    metrics.get("count", 0) for metrics in current_metrics.get("performance", {}).values()
                ),
                "avg_success_rate": self._calculate_avg_success_rate(current_metrics.get("performance", {})),
                "avg_duration": self._calculate_avg_duration(current_metrics.get("performance", {})),
            },
            "custom_metrics_count": len(current_metrics.get("custom", {})),
            "alerts_count": len(self.alerts),
            "health_status": self.get_health_status(),
        }
        
        return summary
    
    def _calculate_avg_success_rate(self, performance_metrics: Dict[str, Any]) -> float:
        """Calculate average success rate across all operations"""
        if not performance_metrics:
            return 1.0
        
        total_operations = 0
        total_successes = 0
        
        for metrics in performance_metrics.values():
            total_operations += metrics.get("count", 0)
            total_successes += metrics.get("success_count", 0)
        
        return total_successes / total_operations if total_operations > 0 else 1.0
    
    def _calculate_avg_duration(self, performance_metrics: Dict[str, Any]) -> float:
        """Calculate average duration across all operations"""
        if not performance_metrics:
            return 0.0
        
        total_operations = 0
        total_duration = 0.0
        
        for metrics in performance_metrics.values():
            total_operations += metrics.get("count", 0)
            total_duration += metrics.get("total_duration", 0.0)
        
        return total_duration / total_operations if total_operations > 0 else 0.0


# Global monitoring service instance
_monitoring_service = None


def get_monitoring_service() -> MonitoringService:
    """Get global monitoring service instance"""
    global _monitoring_service
    
    if _monitoring_service is None:
        _monitoring_service = MonitoringService()
    
    return _monitoring_service


def record_metric(category: str, name: str, value: Any, metadata: Optional[Dict[str, Any]] = None):
    """Record a metric using global monitoring service"""
    service = get_monitoring_service()
    service.record_metric(category, name, value, metadata)


def record_performance(operation: str, duration: float, success: bool = True, metadata: Optional[Dict[str, Any]] = None):
    """Record performance metric using global monitoring service"""
    service = get_monitoring_service()
    service.record_performance_metric(operation, duration, success, metadata)


def create_alert(alert_type: str, message: str, severity: str = "info", metadata: Optional[Dict[str, Any]] = None):
    """Create an alert using global monitoring service"""
    service = get_monitoring_service()
    service.create_alert(alert_type, message, severity, metadata) 