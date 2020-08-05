Using Dashboard
================

Hangfire Dashboard is a place where you could find all the information about your background jobs. It is written as an OWIN middleware (if you are not familiar with OWIN, don't worry), so you can plug it into your ASP.NET, ASP.NET MVC, Nancy, ServiceStack application as well as use `OWIN Self-Host <http://www.asp.net/web-api/overview/hosting-aspnet-web-api/use-owin-to-self-host-web-api>`_ feature to host Dashboard inside console applications or in Windows Services.

.. contents::
   :local:

Adding Dashboard (OWIN)
-----------------

.. admonition:: Additional package required for `ASP.NET <getting-started/aspnet-applications.rst>`_ and `ASP.NET Core <getting-started/aspnet-core-applications.rst>`_
   :class: note

   Before moving to the next steps, ensure you have `Microsoft.Owin.Host.SystemWeb <https://www.nuget.org/packages/Microsoft.Owin.Host.SystemWeb/>`_ package installed, otherwise you'll have different strange problems with the Dashboard.

`OWIN Startup class <http://www.asp.net/aspnet/overview/owin-and-katana/owin-startup-class-detection>`_ is intended to keep web application bootstrap logic in a single place. In Visual Studio 2013 you can add it by right clicking on the project and choosing the *Add / OWIN Startup Class* menu item.

.. image:: add-owin-startup.png


If you have Visual Studio 2012 or earlier, just create a regular class in the root folder of your application, name it ``Startup`` and place the following contents:

.. code-block:: c#

    using Hangfire;
    using Microsoft.Owin;
    using Owin;

    [assembly: OwinStartup(typeof(MyWebApplication.Startup))]

    namespace MyWebApplication
    {
        public class Startup
        {
            public void Configuration(IAppBuilder app)
            {
                // Map Dashboard to the `http://<your-app>/hangfire` URL.
                app.UseHangfireDashboard();
            }
        }
    }

After performing these steps, open your browser and hit the *http://<your-app>/hangfire* URL to see the Dashboard.

.. admonition:: Authorization configuration required
   :class: warning

   By default Hangfire allows access to Dashboard pages **only for local requests**. In order to give appropriate rights for production use, please see the `Configuring Authorization`_ section.

Configuring Authorization
--------------------------

Hangfire Dashboard exposes sensitive information about your background jobs, including method names and serialized arguments as well as gives you an opportunity to manage them by performing different actions – retry, delete, trigger, etc. So it is really important to restrict access to the Dashboard. 

To make it secure by default, only **local requests are allowed**, however you can change this by passing your own implementations of the ``IDashboardAuthorizationFilter`` interface, whose ``Authorize`` method is used to allow or prohibit a request. The first step is to provide your own implementation.

.. admonition:: Don't want to reinvent the wheel?
   :class: note

   User, role and claims -based as well as basic access authentication-based (simple login-password auth) authorization filters available as a NuGet package
   `Hangfire.Dashboard.Authorization <https://github.com/HangfireIO/Hangfire.Dashboard.Authorization>`_.

.. code-block:: c#

   public class MyAuthorizationFilter : IDashboardAuthorizationFilter
   {
       public bool Authorize(DashboardContext context)
       {
           // In case you need an OWIN context, use the next line, `OwinContext` class 
           // is the part of the `Microsoft.Owin` package.
           var owinContext = new OwinContext(context.GetOwinEnvironment());

           // Allow all authenticated users to see the Dashboard (potentially dangerous).
           return owinContext.Authentication.User.Identity.IsAuthenticated;
       }
   }

For ASP.NET Core environments, use the ``GetHttpContext`` extension method defined in the ``Hangfire.AspNetCore`` package.

.. code-block:: c#

   public class MyAuthorizationFilter : IDashboardAuthorizationFilter
   {
       public bool Authorize(DashboardContext context)
       {
           var httpContext = context.GetHttpContext();

           // Allow all authenticated users to see the Dashboard (potentially dangerous).
           return httpContext.User.Identity.IsAuthenticated;
       }
   }

The second step is to pass it to the ``UseHangfireDashboard`` method. You can pass multiple filters, and the access will be granted only if *all of them* return ``true``.

.. code-block:: c#

   app.UseHangfireDashboard("/hangfire", new DashboardOptions
   {
       Authorization = new [] { new MyAuthorizationFilter() }
   });

.. admonition:: Method call order is important
   :class: warning

   Place a call to the ``UseHangfireDashboard`` method **after other authentication methods** in your OWIN Startup class. Otherwise authentication may not work for you.

   .. code-block:: c#

        public void Configuration(IAppBuilder app)
        {            
            app.UseCookieAuthentication(...); // Authentication - first
            app.UseHangfireDashboard();       // Hangfire - last
        }

Read-only view
--------------

The read-only dashboard view prevents users from changing anything, such as deleting or enqueueing jobs. It is off by default, meaning that users have full control. To enable it, set the ``IsReadOnlyFunc`` property of the ``DashboardOptions``:

.. code-block:: c#

   app.UseHangfireDashboard("/hangfire", new DashboardOptions
   {
       IsReadOnlyFunc = (DashboardContext context) => true
   });

Change URL Mapping
-------------------

By default, ``UseHangfireDashboard`` method maps the Dashboard to the ``/hangfire`` path. If you want to change this for one reason or another, just pass your URL path.

.. code-block:: c#

   // Map the Dashboard to the root URL
   app.UseHangfireDashboard("");

   // Map to the `/jobs` URL
   app.UseHangfireDashboard("/jobs");

Change *Back to site* Link
---------------------------

By default, *Back to site* link (top-right corner of Dashboard) leads you to the root URL of your application. In order to change it, use the ``DashboardOptions`` class.

.. code-block:: c#

   // Change `Back to site` link URL
   var options = new DashboardOptions { AppPath = "http://your-app.net" };
   // Make `Back to site` link working for subfolder applications
   var options = new DashboardOptions { AppPath = VirtualPathUtility.ToAbsolute("~") };

   app.UseHangfireDashboard("/hangfire", options);

Multiple Dashboards
--------------------

You can also map multiple dashboards that show information about different storages.

.. code-block:: c#

   var storage1 = new SqlServerStorage("Connection1");
   var storage2 = new SqlServerStorage("Connection2");

   app.UseHangfireDashboard("/hangfire1", new DashboardOptions(), storage1);
   app.UseHangfireDashboard("/hangfire2", new DashboardOptions(), storage2);



