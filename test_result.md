#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Build a full-stack, multi-page modern web application for Hogwarts Music Studio with admin dashboard, OTP-based auth with forgot password, booking with hours selection, and user dashboard for tracking. Add customisable Careers page content and Applications tab content in admin CMS. Scroll to top on navigation."

backend:
  - task: "Forgot Password API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "POST /api/auth/forgot-password sends OTP to email. POST /api/auth/reset-password verifies OTP and updates password."

  - task: "Content Management API - Careers Fields"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added careers_badge, careers_title, careers_subtitle, careers_description, careers_intern_title, careers_intern_desc, careers_job_title, careers_job_desc, careers_form_title, careers_form_subtitle to SiteContentUpdate model. Also added applications_title, applications_subtitle, applications_empty_text."

  - task: "Resend OTP API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "POST /api/admin/resend-otp sends new OTP for admin registration."

  - task: "Job Applications API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "POST /api/applications creates job application. GET /api/applications returns all applications. PUT /api/applications/{id}/status updates status."

frontend:
  - task: "ScrollToTop Component"
    implemented: true
    working: true
    file: "/app/frontend/src/components/ScrollToTop.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Created ScrollToTop component that scrolls to top on route change. Verified working via screenshot test."

  - task: "Careers Page Content Customization"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/CareersPage.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "CareersPage already fetches content from API and uses dynamic text for badge, title, subtitle, description, intern/engineer cards, and form."

  - task: "Admin Dashboard - Content Tab Careers Fields"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Added Careers Page section with fields for badge, title, subtitle, description, intern card title/desc, job card title/desc, form title/subtitle. Added Applications Tab section with title, subtitle, and empty state text."

  - task: "HomePage Dynamic Content"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/HomePage.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Updated hero_badge, services_badge, services_title, projects_badge, projects_title, projects_subtitle, cta_title, cta_subtitle, cta_button_text to use dynamic content from API."

  - task: "Booking with Hours"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Booking model now includes 'hours' field. Frontend shows hours selection for Dubbing and Vocal Recording services."

  - task: "Image Upload API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Image upload endpoint /api/upload/image working. Returns proper URL. Static file serving at /api/uploads/{filename} working."

  - task: "Admin RBAC (Role-Based Access Control)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Super admin (leocelestine.s@gmail.com) has full access. Basic admins have view-only access. Access level stored in 'access_level' field."

  - task: "Site Settings API"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "GET /api/settings/site returns theme settings. PUT /api/settings/site updates theme (super admin only)."

  - task: "Services CRUD"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Create, Read, Update, Delete services working with proper authorization."

  - task: "Projects CRUD"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Create, Read, Update, Delete projects working with proper authorization."

  - task: "Booking System with Email"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Booking creation sends confirmation email to user and notification to admin via Resend API."

frontend:
  - task: "Admin Dashboard - Services Management"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Services management showing all 6 services with images, edit/delete buttons, and add service functionality."

  - task: "Admin Dashboard - Projects Management"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Projects management with image uploads, edit/delete functionality."

  - task: "Admin Dashboard - Site Settings"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Site settings page showing background type, brand colors with color pickers, and save button. Changes should reflect on main site via ThemeContext."

  - task: "Image Display with Fallbacks"
    implemented: true
    working: true
    file: "/app/frontend/src/utils/imageUtils.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Created imageUtils.js with resolveImageUrl() and handleImageError() functions. All pages now properly handle broken images with fallbacks."

  - task: "Dynamic Theme Application"
    implemented: true
    working: true
    file: "/app/frontend/src/context/ThemeContext.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "ThemeContext fetches settings from backend and applies CSS variables. refreshTheme() called after saving settings."

  - task: "Admin Access Level Dropdown"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/AdminDashboard.js"
    stuck_count: 0
    priority: "medium"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Admin Team page shows dropdown for basic/full access selection for non-super admins."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 4
  run_ui: true

test_plan:
  current_focus:
    - "Admin Dashboard functionality"
    - "Image uploads and display"
    - "Theme management"
    - "Admin RBAC"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Fixed major issues: 1) Image display now uses resolveImageUrl() with proper fallbacks, 2) ThemeContext created for dynamic theme application, 3) Admin access_level dropdown fixed to use correct API payload, 4) SiteSettings now refreshes theme after saving. Admin credentials: leocelestine.s@gmail.com / Admin123!"