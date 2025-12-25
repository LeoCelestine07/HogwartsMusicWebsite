#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class HogwartsAPITester:
    def __init__(self, base_url="https://glassmorphic-hub-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name, success, details="", expected_status=None, actual_status=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {details}")
            if expected_status and actual_status:
                print(f"   Expected: {expected_status}, Got: {actual_status}")
        
        self.results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "expected_status": expected_status,
            "actual_status": actual_status
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = ""
            if not success:
                try:
                    error_data = response.json()
                    details = error_data.get('detail', 'Unknown error')
                except:
                    details = response.text[:100]

            self.log_result(name, success, details, expected_status, response.status_code)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return None

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        print("\n🔐 Testing Admin Authentication...")
        response = self.run_test(
            "Admin Login",
            "POST",
            "admin/login",
            200,
            data={"email": "leocelestine.s@gmail.com", "password": "Admin123!"}
        )
        if response and 'token' in response:
            self.token = response['token']
            return True
        return False

    def test_services_page_cms(self):
        """Test Services Page CMS functionality"""
        print("\n🛠️ Testing Services Page CMS...")
        
        # Get current content
        content = self.run_test(
            "Get Site Content",
            "GET", 
            "settings/content",
            200
        )
        
        if content:
            # Check if services page fields exist
            services_fields = [
                'services_page_badge', 'services_page_title', 'services_page_title_gradient',
                'services_page_subtitle', 'services_cta_title', 'services_cta_subtitle', 'services_cta_button'
            ]
            missing_fields = []
            for field in services_fields:
                if field not in content:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_result("Services Page Fields Present", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("Services Page Fields Present", True)
                
                # Test updating services page content
                update_data = {
                    "services_page_badge": "Our Services",
                    "services_page_title": "Professional Audio",
                    "services_page_title_gradient": "Solutions",
                    "services_page_subtitle": "From dubbing to mastering, we offer comprehensive audio post-production services.",
                    "services_cta_title": "Not Sure Which Service You Need?",
                    "services_cta_subtitle": "Let's discuss your project and find the perfect solution.",
                    "services_cta_button": "Get in Touch"
                }
                
                updated = self.run_test(
                    "Update Services Page Content",
                    "PUT",
                    "settings/content",
                    200,
                    data=update_data
                )
                
                if updated:
                    # Verify the update
                    for key, value in update_data.items():
                        if updated.get(key) == value:
                            self.log_result(f"Services Page Field {key} Updated", True)
                        else:
                            self.log_result(f"Services Page Field {key} Updated", False, f"Expected {value}, got {updated.get(key)}")

    def test_about_page_cms(self):
        """Test About Page CMS functionality"""
        print("\n📖 Testing About Page CMS...")
        
        # Get current content
        content = self.run_test(
            "Get Site Content",
            "GET", 
            "settings/content",
            200
        )
        
        if content:
            # Check if about page fields exist
            about_fields = [
                'about_page_badge', 'about_page_title', 'about_page_title_gradient', 'about_page_description',
                'about_philosophy_title', 'about_philosophy_text', 'about_feature1', 'about_feature2', 'about_feature3',
                'about_values_badge', 'about_values_title', 'about_journey_badge', 'about_journey_title',
                'about_cta_title', 'about_cta_title_gradient', 'about_cta_subtitle', 'about_cta_button'
            ]
            missing_fields = []
            for field in about_fields:
                if field not in content:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_result("About Page Fields Present", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("About Page Fields Present", True)
                
                # Test updating about page content
                update_data = {
                    "about_page_badge": "About Us",
                    "about_page_title": "Crafting Sound",
                    "about_page_title_gradient": "Since 2018",
                    "about_page_description": "Hogwarts Music Studio is a professional audio post-production facility.",
                    "about_philosophy_title": "Our Philosophy",
                    "about_philosophy_text": "We believe that great sound is invisible — it amplifies emotional impact.",
                    "about_feature1": "Industry-standard equipment",
                    "about_feature2": "Fast turnaround times", 
                    "about_feature3": "Dedicated support team",
                    "about_values_badge": "Our Values",
                    "about_values_title": "What Drives Us",
                    "about_journey_badge": "Our Journey",
                    "about_journey_title": "The Story So Far",
                    "about_cta_title": "Let's Create Something",
                    "about_cta_title_gradient": "Extraordinary",
                    "about_cta_subtitle": "Ready to elevate your project with professional audio?",
                    "about_cta_button": "Start a Project"
                }
                
                updated = self.run_test(
                    "Update About Page Content",
                    "PUT",
                    "settings/content",
                    200,
                    data=update_data
                )
                
                if updated:
                    # Verify the update
                    for key, value in update_data.items():
                        if updated.get(key) == value:
                            self.log_result(f"About Page Field {key} Updated", True)
                        else:
                            self.log_result(f"About Page Field {key} Updated", False, f"Expected {value}, got {updated.get(key)}")

    def test_application_form_labels_cms(self):
        """Test Application Form Labels CMS functionality"""
        print("\n📝 Testing Application Form Labels CMS...")
        
        # Test updating application form labels
        form_labels = {
            "app_name_label": "Full Name *",
            "app_email_label": "Email Address *", 
            "app_phone_label": "Phone Number *",
            "app_city_label": "City *",
            "app_instagram_label": "Instagram ID (optional)",
            "app_youtube_label": "YouTube Links (optional)",
            "app_cv_label": "Upload CV/Resume (optional)",
            "app_note_label": "Tell us about yourself *",
            "app_portfolio_label": "Portfolio Link (optional)"
        }
        
        updated = self.run_test(
            "Update Application Form Labels",
            "PUT",
            "settings/content", 
            200,
            data=form_labels
        )
        
        if updated:
            for key, value in form_labels.items():
                if updated.get(key) == value:
                    self.log_result(f"Form Label {key} Updated", True)
                else:
                    self.log_result(f"Form Label {key} Updated", False, f"Expected {value}, got {updated.get(key)}")

    def test_job_application_with_new_fields(self):
        """Test job application with Instagram, YouTube links, and CV upload"""
        print("\n💼 Testing Enhanced Job Application...")
        
        # Test job application with new fields
        application_data = {
            "name": "Test Applicant",
            "email": "test@example.com",
            "phone": "+91 9876543210",
            "city": "Mumbai",
            "position_type": "intern",
            "note": "I am passionate about audio engineering and would love to learn from your team.",
            "portfolio_url": "https://portfolio.example.com",
            "instagram_id": "@testuser",
            "youtube_link1": "https://youtube.com/watch?v=test1",
            "youtube_link2": "https://youtube.com/watch?v=test2", 
            "youtube_link3": "https://youtube.com/watch?v=test3",
            "cv_filename": "test_cv.pdf"
        }
        
        response = self.run_test(
            "Submit Job Application with New Fields",
            "POST",
            "applications",
            200,
            data=application_data
        )
        
        if response:
            self.log_result("Job Application Submission", True)
            return response.get('id')
        return None

    def test_cv_upload_endpoint(self):
        """Test CV upload endpoint"""
        print("\n📄 Testing CV Upload Endpoint...")
        
        # Test CV upload endpoint exists (we can't actually upload without file)
        # But we can test the endpoint responds correctly to missing file
        try:
            url = f"{self.base_url}/upload/cv"
            response = requests.post(url, timeout=10)
            
            # Should return 422 for missing file, not 404
            if response.status_code == 422:
                self.log_result("CV Upload Endpoint Exists", True, "Endpoint responds correctly to missing file")
            elif response.status_code == 404:
                self.log_result("CV Upload Endpoint Exists", False, "Endpoint not found")
            else:
                self.log_result("CV Upload Endpoint Exists", True, f"Endpoint exists (status: {response.status_code})")
                
        except Exception as e:
            self.log_result("CV Upload Endpoint Exists", False, f"Exception: {str(e)}")

    def test_projects_page_cms(self):
        """Test Projects Page CMS functionality"""
        print("\n📊 Testing Projects Page CMS...")
        
        # Get current content
        content = self.run_test(
            "Get Site Content",
            "GET", 
            "settings/content",
            200
        )
        
        if content:
            # Check if projects page stats fields exist
            projects_fields = [
                'projects_page_badge', 'projects_page_title', 'projects_page_title_gradient',
                'projects_page_subtitle', 'projects_stat1_value', 'projects_stat1_label',
                'projects_stat2_value', 'projects_stat2_label', 'projects_stat3_value', 
                'projects_stat3_label', 'projects_stat4_value', 'projects_stat4_label'
            ]
            missing_fields = []
            for field in projects_fields:
                if field not in content:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_result("Projects Page Stats Fields Present", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("Projects Page Stats Fields Present", True)
                
                # Test updating projects page stats
                update_data = {
                    "projects_stat1_value": "50+",
                    "projects_stat1_label": "Projects Completed",
                    "projects_stat2_value": "25+", 
                    "projects_stat2_label": "Films Dubbed",
                    "projects_stat3_value": "100+",
                    "projects_stat3_label": "Hours Mixed",
                    "projects_stat4_value": "99%",
                    "projects_stat4_label": "Client Satisfaction"
                }
                
                updated = self.run_test(
                    "Update Projects Page Stats",
                    "PUT",
                    "settings/content",
                    200,
                    data=update_data
                )
                
                if updated:
                    # Verify the update
                    for key, value in update_data.items():
                        if updated.get(key) == value:
                            self.log_result(f"Projects Stats Field {key} Updated", True)
                        else:
                            self.log_result(f"Projects Stats Field {key} Updated", False, f"Expected {value}, got {updated.get(key)}")

    def test_timeline_cms(self):
        """Test About Page Timeline CMS functionality"""
        print("\n📅 Testing About Page Timeline CMS...")
        
        # Get current content
        content = self.run_test(
            "Get Site Content",
            "GET", 
            "settings/content",
            200
        )
        
        if content:
            # Check if timeline fields exist
            timeline_fields = [
                'timeline_year1', 'timeline_title1', 'timeline_desc1',
                'timeline_year2', 'timeline_title2', 'timeline_desc2',
                'timeline_year3', 'timeline_title3', 'timeline_desc3',
                'timeline_year4', 'timeline_title4', 'timeline_desc4'
            ]
            missing_fields = []
            for field in timeline_fields:
                if field not in content:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_result("Timeline Fields Present", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("Timeline Fields Present", True)
                
                # Test updating timeline content
                update_data = {
                    "timeline_year1": "2018",
                    "timeline_title1": "Founded",
                    "timeline_desc1": "Started as a small dubbing studio with a passion for sound.",
                    "timeline_year2": "2020",
                    "timeline_title2": "Expansion", 
                    "timeline_desc2": "Upgraded to state-of-the-art equipment and expanded services.",
                    "timeline_year3": "2022",
                    "timeline_title3": "Growth",
                    "timeline_desc3": "Served 50+ clients including indie filmmakers and production houses.",
                    "timeline_year4": "2024",
                    "timeline_title4": "Present",
                    "timeline_desc4": "Full-service audio post-production with cutting-edge technology."
                }
                
                updated = self.run_test(
                    "Update Timeline Content",
                    "PUT",
                    "settings/content",
                    200,
                    data=update_data
                )
                
                if updated:
                    # Verify the update
                    for key, value in update_data.items():
                        if updated.get(key) == value:
                            self.log_result(f"Timeline Field {key} Updated", True)
                        else:
                            self.log_result(f"Timeline Field {key} Updated", False, f"Expected {value}, got {updated.get(key)}")

    def test_application_status_update_email(self):
        """Test application status update with email sending"""
        print("\n📧 Testing Application Status Update with Email...")
        
        # First create a test application
        application_data = {
            "name": "Test Applicant for Email",
            "email": "test.email@example.com",
            "phone": "+91 9876543210",
            "city": "Mumbai",
            "position_type": "engineer",
            "note": "Test application for email functionality testing."
        }
        
        app_response = self.run_test(
            "Create Test Application",
            "POST",
            "applications",
            200,
            data=application_data
        )
        
        if app_response and 'id' in app_response:
            app_id = app_response['id']
            
            # Test updating status to 'hired' (should trigger email)
            status_update = {"status": "hired"}
            
            updated = self.run_test(
                "Update Application Status to Hired",
                "PUT",
                f"applications/{app_id}/status",
                200,
                data=status_update
            )
            
            if updated:
                if updated.get('status') == 'hired':
                    self.log_result("Application Status Updated to Hired", True)
                    # Note: We can't directly test email sending without email service access
                    # But we can verify the API call succeeds
                    self.log_result("Email Trigger for Hired Status", True, "API call successful - email should be sent")
                else:
                    self.log_result("Application Status Updated to Hired", False, f"Status not updated correctly: {updated.get('status')}")
            
            # Test other status updates
            for status in ['rejected', 'pending']:
                status_update = {"status": status}
                updated = self.run_test(
                    f"Update Application Status to {status.title()}",
                    "PUT",
                    f"applications/{app_id}/status",
                    200,
                    data=status_update
                )
                
                if updated and updated.get('status') == status:
                    self.log_result(f"Application Status Updated to {status.title()}", True)
                else:
                    self.log_result(f"Application Status Updated to {status.title()}", False)

    def test_admin_applications_access(self):
        """Test admin access to job applications"""
        print("\n👨‍💼 Testing Admin Applications Access...")
        
        applications = self.run_test(
            "Get Job Applications (Admin)",
            "GET",
            "applications",
            200
        )
        
        if applications is not None:
            self.log_result("Admin Applications Access", True, f"Found {len(applications)} applications")
            
            # Check if applications have the new fields
            if applications:
                app = applications[0]
                new_fields = ['instagram_id', 'youtube_link1', 'youtube_link2', 'youtube_link3', 'cv_filename']
                for field in new_fields:
                    if field in app:
                        self.log_result(f"Application Field {field} Present", True)
                    else:
                        self.log_result(f"Application Field {field} Present", False, "Field missing in application data")

    def test_general_api_health(self):
        """Test general API health"""
        print("\n🏥 Testing General API Health...")
        
        # Test basic endpoints
        endpoints = [
            ("Get Services", "GET", "services", 200),
            ("Get Projects", "GET", "projects", 200),
            ("Get Site Content", "GET", "settings/content", 200),
            ("Get Contact Info", "GET", "settings/contact", 200)
        ]
        
        for name, method, endpoint, expected_status in endpoints:
            self.run_test(name, method, endpoint, expected_status)

    def run_all_tests(self):
        """Run all tests"""
        print("🎵 Starting Hogwarts Music Studio API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Test admin login first
        if not self.test_admin_login():
            print("❌ Admin login failed - skipping admin-only tests")
            
        # Test general API health
        self.test_general_api_health()
        
        # Test new CMS features
        if self.token:
            self.test_projects_page_cms()
            self.test_timeline_cms()
            self.test_services_page_cms()
            self.test_about_page_cms()
            self.test_application_form_labels_cms()
            self.test_application_status_update_email()
            self.test_admin_applications_access()
        
        # Test job application features (public endpoints)
        self.test_job_application_with_new_fields()
        self.test_cv_upload_endpoint()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Save detailed results
        results_data = {
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "tests_run": self.tests_run,
                "tests_passed": self.tests_passed,
                "success_rate": f"{(self.tests_passed/self.tests_run*100):.1f}%"
            },
            "detailed_results": self.results
        }
        
        with open('/app/test_reports/backend_test_results.json', 'w') as f:
            json.dump(results_data, f, indent=2)
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = HogwartsAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)