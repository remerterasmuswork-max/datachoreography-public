/**
 * AR Chaser Lite Skill Manifest
 * Example skill that identifies overdue invoices and generates reminder tasks
 */

export const ARChaserLiteManifest = {
  "skill_id": "ar_chaser_lite",
  "skill_name": "AR Chaser Lite",
  "version": "1.0.0",
  "description": "Automatically identifies overdue invoices and generates segmented reminder tasks based on days overdue",
  "category": "finance",
  "publisher": "DataChoreography Official",
  "publisher_verified": true,
  
  "input_schema": {
    "type": "object",
    "properties": {
      "include_segments": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["0-30", "31-60", "61-90", "90+"]
        },
        "description": "Which aging segments to include",
        "default": ["0-30", "31-60", "61-90", "90+"]
      },
      "max_invoices": {
        "type": "integer",
        "minimum": 1,
        "maximum": 1000,
        "default": 100,
        "description": "Maximum number of invoices to process"
      },
      "customer_filter": {
        "type": "object",
        "description": "Optional filter for specific customers",
        "properties": {
          "customer_ids": {
            "type": "array",
            "items": {"type": "string"}
          },
          "exclude_customers": {
            "type": "array",
            "items": {"type": "string"}
          }
        }
      }
    },
    "required": []
  },
  
  "output_schema": {
    "type": "object",
    "properties": {
      "overdue_count": {
        "type": "integer",
        "description": "Total number of overdue invoices"
      },
      "total_overdue_amount": {
        "type": "number",
        "description": "Total amount due across all overdue invoices"
      },
      "segments": {
        "type": "object",
        "description": "Count of invoices in each segment",
        "properties": {
          "0-30": {"type": "integer"},
          "31-60": {"type": "integer"},
          "61-90": {"type": "integer"},
          "90+": {"type": "integer"}
        }
      },
      "tasks": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "invoice_id": {"type": "string"},
            "customer_email": {"type": "string"},
            "amount_due": {"type": "number"},
            "days_overdue": {"type": "string"},
            "action": {"type": "string"},
            "priority": {"type": "string"}
          }
        },
        "description": "Generated reminder tasks"
      }
    }
  },
  
  "required_connections": ["xero"],
  
  "required_scopes": [
    "read_invoices",
    "read_customers"
  ],
  
  "optional_scopes": [
    "send_email",
    "create_tasks"
  ],
  
  "allowed_entities": ["Invoice", "Customer"],
  
  "safety_level": "safe",
  
  "capabilities": [
    {
      "name": "identify_overdue_invoices",
      "description": "Query and identify overdue invoices"
    },
    {
      "name": "segment_by_aging",
      "description": "Segment invoices by days overdue"
    },
    {
      "name": "generate_reminder_tasks",
      "description": "Create prioritized reminder tasks"
    }
  ],
  
  "configuration": {
    "reminder_templates": {
      "type": "object",
      "description": "Custom email templates for each segment",
      "default": {
        "0-30": "gentle_reminder",
        "31-60": "firm_reminder",
        "61-90": "urgent_reminder",
        "90+": "final_notice"
      }
    },
    "auto_send_emails": {
      "type": "boolean",
      "description": "Automatically send reminder emails (requires send_email scope)",
      "default": false
    },
    "escalation_threshold": {
      "type": "integer",
      "description": "Days overdue before escalating to manager",
      "default": 60
    }
  },
  
  "timeout_ms": 30000,
  
  "rate_limits": {
    "executions_per_hour": 100,
    "executions_per_day": 500
  },
  
  "pricing": {
    "model": "free",
    "credits_per_execution": 1
  },
  
  "metadata": {
    "icon_url": "https://assets.datachoreography.com/skills/ar-chaser-lite.svg",
    "documentation_url": "https://docs.datachoreography.com/skills/ar-chaser-lite",
    "support_email": "support@datachoreography.com",
    "changelog": [
      {
        "version": "1.0.0",
        "date": "2025-01-09",
        "changes": ["Initial release"]
      }
    ]
  }
};

export default ARChaserLiteManifest;