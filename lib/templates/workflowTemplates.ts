export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  json: Record<string, unknown>; // raw WorkflowPlan JSON
};

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "send-welcome-email",
    name: "Send Welcome Email",
    description: "Sends a welcome email to a single recipient when triggered manually.",
    json: {
      name: "Send Welcome Email",
      description: "Sends a welcome email to a new user",
      intent: "Send a welcome email to a single recipient",
      trigger: {
        type: "manual",
        config: {}
      },
      actions: [
        {
          id: "step_1",
          type: "send_email",
          params: {
            to: "user@example.com",
            subject: "Welcome!",
            body: "Welcome to our service! We're excited to have you."
          },
          onSuccessNext: [],
          onFailureNext: []
        }
      ]
    }
  },
  {
    id: "notify-slack-on-lead",
    name: "Notify Slack on New Lead",
    description: "Sends a Slack message to a channel when a new lead is detected (manual trigger).",
    json: {
      name: "Notify Slack on New Lead",
      description: "Sends a notification to Slack when a new lead is created",
      intent: "Notify team in Slack channel about new lead",
      trigger: {
        type: "manual",
        config: {}
      },
      actions: [
        {
          id: "step_1",
          type: "http_request",
          params: {
            url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: {
              channel: "#general",
              text: "New lead received!"
            }
          },
          onSuccessNext: [],
          onFailureNext: []
        }
      ]
    }
  },
  {
    id: "forward-contact-form",
    name: "Forward Contact Form Submission",
    description: "Receives form submissions via webhook and forwards them via email.",
    json: {
      name: "Forward Contact Form Submission",
      description: "Forwards contact form submissions to an email address",
      intent: "Forward webhook form data to email",
      trigger: {
        type: "webhook",
        config: {
          path: "/webhook/contact-form",
          method: "POST"
        }
      },
      actions: [
        {
          id: "step_1",
          type: "send_email",
          params: {
            to: "admin@example.com",
            subject: "New Contact Form Submission",
            body: "A new contact form submission has been received. Please check the webhook payload for details."
          },
          onSuccessNext: [],
          onFailureNext: []
        }
      ]
    }
  },
  {
    id: "new-lead-slack-notification",
    name: "New Lead → Slack Notification",
    description: "Sends a Slack alert every time a new lead submits a form via webhook.",
    json: {
      name: "New Lead → Slack Notification",
      description: "Sends a Slack alert when a new lead submits a form",
      intent: "Notify team in Slack when new lead is received",
      trigger: {
        type: "webhook",
        config: {
          path: "/webhook/new-lead",
          method: "POST"
        }
      },
      actions: [
        {
          id: "step_1",
          type: "http_request",
          params: {
            url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: {
              channel: "#leads",
              text: "New lead received! Check webhook payload for details."
            }
          },
          onSuccessNext: [],
          onFailureNext: []
        }
      ]
    }
  },
  {
    id: "new-lead-email-autoresponder",
    name: "New Lead → Email Autoresponder",
    description: "Automatically sends a welcome email to new leads when they submit a form.",
    json: {
      name: "New Lead → Email Autoresponder",
      description: "Sends automatic email response to new leads",
      intent: "Send welcome email to new lead automatically",
      trigger: {
        type: "webhook",
        config: {
          path: "/webhook/new-lead",
          method: "POST"
        }
      },
      actions: [
        {
          id: "step_1",
          type: "send_email",
          params: {
            to: "lead@example.com",
            subject: "Thank you for your interest!",
            body: "Thank you for reaching out! We'll get back to you soon."
          },
          onSuccessNext: [],
          onFailureNext: []
        }
      ]
    }
  },
  {
    id: "inbound-lead-save-google-sheet",
    name: "Inbound Lead → Save to Google Sheet",
    description: "Saves new lead information to a Google Sheet when form is submitted.",
    json: {
      name: "Inbound Lead → Save to Google Sheet",
      description: "Saves lead data to Google Sheets",
      intent: "Store lead information in Google Sheets",
      trigger: {
        type: "webhook",
        config: {
          path: "/webhook/new-lead",
          method: "POST"
        }
      },
      actions: [
        {
          id: "step_1",
          type: "http_request",
          params: {
            url: "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/A1:append",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer YOUR_ACCESS_TOKEN"
            },
            body: {
              values: [
                ["Name", "Email", "Message"]
              ]
            }
          },
          onSuccessNext: [],
          onFailureNext: []
        }
      ]
    }
  },
  {
    id: "lead-qualification-email-slack-combo",
    name: "Lead Qualification → Email + Slack Combo",
    description: "Sends qualification email to lead, then notifies team in Slack (2-step sequence).",
    json: {
      name: "Lead Qualification → Email + Slack Combo",
      description: "Sends email to lead and notifies Slack",
      intent: "Qualify lead with email and notify team",
      trigger: {
        type: "manual",
        config: {}
      },
      actions: [
        {
          id: "step_1",
          type: "send_email",
          params: {
            to: "lead@example.com",
            subject: "Let's discuss your needs",
            body: "Hi! We'd love to learn more about your requirements. Let's schedule a call."
          },
          onSuccessNext: ["step_2"],
          onFailureNext: []
        },
        {
          id: "step_2",
          type: "http_request",
          params: {
            url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: {
              channel: "#sales",
              text: "Qualification email sent to lead. Follow up required."
            }
          },
          onSuccessNext: [],
          onFailureNext: []
        }
      ]
    }
  }
];

