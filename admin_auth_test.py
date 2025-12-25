#!/usr/bin/env python3
"""
Hogwarts Music Studio - Admin Authentication Testing
Specifically tests admin login flow and /api/auth/me endpoint
"""

import requests
import sys
import json
from datetime import datetime
import uuid

class AdminAuthTester:
    def __init__(self, base_url="https://melody-craft-35.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f" (Expected {expected_status})"
                try:
                    error_data = response.json()
                    details += f" - {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f" - {response.text[:200]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {"status": "success"}
            return None

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return None

    def test_admin_otp_request(self):
        """Test admin OTP request"""
        print("\n🔐 Testing Admin OTP Request...")
        otp_data = {"email": "leocelestine.s@gmail.com"}
        result = self.run_test("Admin OTP Request", "POST", "admin/request-otp", 200, otp_data)
        return result is not None

    def test_admin_login_direct(self):
        """Test direct admin login (if admin already exists)"""
        print("\n🔑 Testing Direct Admin Login...")
        
        # Try to login with admin credentials
        login_data = {
            "email": "leocelestine.s@gmail.com",
            "password": "admin123"  # Common test password
        }
        
        result = self.run_test("Admin Direct Login", "POST", "admin/login", 200, login_data)
        if result and 'token' in result:
            self.admin_token = result['token']
            self.log_test("Admin Token Generated", True)
            return True
        else:
            self.log_test("Admin Token Generated", False, "No token in response")
            return False

    def test_auth_me_endpoint(self):
        """Test /api/auth/me endpoint with admin token"""
        print("\n👤 Testing /api/auth/me Endpoint...")
        
        if not self.admin_token:
            self.log_test("Auth Me Test", False, "No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        result = self.run_test("Auth Me Endpoint", "GET", "auth/me", 200, headers=headers)
        
        if result:
            # Check if role is admin
            role = result.get('role')
            if role == 'admin':
                self.log_test("Admin Role Check", True, f"Role: {role}")
            else:
                self.log_test("Admin Role Check", False, f"Expected 'admin', got '{role}'")
                
            # Check if user data is present
            user_data = result.get('user')
            if user_data and 'email' in user_data:
                self.log_test("Admin User Data", True, f"Email: {user_data['email']}")
            else:
                self.log_test("Admin User Data", False, "Missing user data")
                
            return True
        return False

    def test_admin_protected_endpoints(self):
        """Test admin-only endpoints"""
        print("\n🛡️ Testing Admin Protected Endpoints...")
        
        if not self.admin_token:
            self.log_test("Admin Protected Tests", False, "No admin token available")
            return False
            
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Test admin stats
        self.run_test("Admin Stats", "GET", "admin/stats", 200, headers=headers)
        
        # Test get all bookings (admin only)
        self.run_test("Admin Get Bookings", "GET", "bookings", 200, headers=headers)
        
        return True

    def test_projects_endpoint_fix(self):
        """Test if projects endpoint is working"""
        print("\n📁 Testing Projects Endpoint...")
        result = self.run_test("Get Projects", "GET", "projects", 200)
        
        if result and isinstance(result, list) and len(result) >= 5:
            self.log_test("Projects Count Check", True, f"Found {len(result)} projects")
            return True
        else:
            self.log_test("Projects Count Check", False, f"Expected ≥5 projects, got {len(result) if result else 0}")
            return False

    def run_admin_tests(self):
        """Run all admin-specific tests"""
        print("🚀 Starting Hogwarts Admin Authentication Tests")
        print("=" * 60)
        
        # Test basic endpoints first
        self.test_projects_endpoint_fix()
        
        # Test admin OTP system
        self.test_admin_otp_request()
        
        # Test direct admin login
        login_success = self.test_admin_login_direct()
        
        if login_success:
            # Test auth/me endpoint
            self.test_auth_me_endpoint()
            
            # Test admin protected endpoints
            self.test_admin_protected_endpoints()
        else:
            print("\n⚠️ Admin login failed - cannot test protected endpoints")
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Admin Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate < 80:
            print("⚠️ Warning: Low success rate detected")
        elif success_rate >= 95:
            print("🎉 Excellent! Admin authentication is working properly")
            
        return success_rate >= 80

def main():
    """Main test execution"""
    tester = AdminAuthTester()
    success = tester.run_admin_tests()
    
    # Save detailed results
    with open('/app/test_reports/admin_auth_test_results.json', 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())