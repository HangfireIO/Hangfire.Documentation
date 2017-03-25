ASP.NET Core Applications
==========================

.. admonition:: Under construction
   :class: warning

   ASP.NET Applications: in-process processing (no windows services), dangers of running (timeouts, deployments, no problems, enhanced shutdown detection), installation (hangfire.core, hangfire.aspnet), startup configuration (storage, authorization), implementation (ismssender, iemailsender), next steps (always-running tip, basic logging).


Before we start with our tutorial, we need to have a working ASP.NET Core application. This documentation is devoted to Hangfire, please, read the official ASP.NET Documentation to learn the details on how to create and initialize a new web application: `Getting Started <https://docs.asp.net/en/latest/getting-started.html>`_ and `Tutorials <https://docs.asp.net/en/latest/tutorials/index.html>`_.

Here is the simplest available method, using the ``dotnet new`` command. After execution the following command, we'll have a sample ASP.NET Core application in the ``HelloHangfire`` folder. So, prepare your terminal, and let's play!

.. code-block:: bash

   mkdir HelloHangfire && cd HelloHangfire
   dotnet new web

Installing Hangfire
--------------------

Hangfire is available as a set of NuGet packages, so you need to add them to the ``project.json`` file, under the ``dependencies`` section. Please note that versions in the code snippet below may be outdated, so use versions from the following badges, they are updated in real-time.

.. |latest-core| image:: https://img.shields.io/nuget/v/Hangfire.Core.svg?label=Hangfire.Core
.. |latest-aspnetcore| image:: https://img.shields.io/nuget/v/Hangfire.AspNetCore.svg?label=Hangfire.AspNetCore
.. |latest-sqlserver| image:: https://img.shields.io/nuget/v/Hangfire.SqlServer.svg?label=Hangfire.SqlServer

|latest-core| |latest-aspnetcore| |latest-sqlserver| 

.. code-block:: xml
   :emphasize-lines: 8-10

   <ItemGroup>
     <PackageReference Include="Microsoft.ApplicationInsights.AspNetCore" Version="2.0.0" />
     <PackageReference Include="Microsoft.AspNetCore" Version="1.0.4" />
     <PackageReference Include="Microsoft.AspNetCore.Mvc" Version="1.0.3" />
     <PackageReference Include="Microsoft.AspNetCore.StaticFiles" Version="1.0.2" />
     <PackageReference Include="Microsoft.Extensions.Logging.Debug" Version="1.0.2" />
     <PackageReference Include="Microsoft.VisualStudio.Web.BrowserLink" Version="1.0.1" />
     <PackageReference Include="Hangfire.Core" Version="1.6.*" />
     <PackageReference Include="Hangfire.SqlServer" Version="1.6.*" />
     <PackageReference Include="Hangfire.AspNetCore" Version="1.6.*" />
   </ItemGroup>

After updating dependencies and saving a file, you need to restore the packages in order to get them installed. In Visual Studio Code, the informational popup will appear just after saving, so click the ``Restore`` button, or run the following command in the terminal.

.. code-block:: bash

   dotnet restore

Configuring Hangfire
---------------------

We'll start our configuration process with defining configuration string for ``Hangfire.SqlServer`` package. Consider you have an ``sqlexpress`` named instance running on localhost, and just created the ``AspNetCoreTest`` database. Current user *should be able to create tables*, to allow automatic migrations to do their job.

Also, ``Hangfire.AspNetCore`` package has a logging integration with ASP.NET Core applications. Hangfire's log messages sometimes very important and help to diagnose different issues. ``Information`` level allows to see how Hangfire is working, and ``Warning`` and upper log level help to investigate problems.

Open the ``appsettings.json`` file, and add the highlighted lines from the following snippet.

.. code-block:: json
   :emphasize-lines: 3,9

   {
       "ConnectionStrings": {
           "HangfireConnection": "Server=.\\sqlexpress;Database=AspNetCoreTest;Integrated Security=SSPI;"
       },
       "Logging": {
           "IncludeScopes": false,
           "LogLevel": {
               "Default": "Debug",
               "Hangfire": "Information"
           }
       }
   }

After updating the application settings, open the ``Startup.cs`` file. Startup class is the heart of ASP.NET Core application's configuration. First we need to import the ``Hangfire`` namespace.

.. code-block:: csharp
   :emphasize-lines: 3
   
   // ...
   using Microsoft.Extensions.Logging;
   using Hangfire;
   using WebApplication.Data;

Dependency Injection is one of the primary techniques introduced in ASP.NET Core. ``Hangfire.AspNetCore`` integration package adds an extension method to register all the services, their implementation, as well as logging and job activator. As a parameter, it takes an action that allows to configure Hangfire itself.

.. code-block:: csharp
   :emphasize-lines: 13-14

   public void ConfigureServices(IServiceCollection services)
   {
       // Add framework services.
       services.AddDbContext<ApplicationDbContext>(options =>
           options.UseSqlite(Configuration.GetConnectionString("DefaultConnection")));

       services.AddIdentity<ApplicationUser, IdentityRole>()
           .AddEntityFrameworkStores<ApplicationDbContext>()
           .AddDefaultTokenProviders();

       services.AddMvc();

       services.AddHangfire(configuration => configuration
           .UseSqlServerStorage(Configuration.GetConnectionString("HangfireConnection")));

       // Add application services.
       services.AddTransient<IEmailSender, AuthMessageSender>();
       services.AddTransient<ISmsSender, AuthMessageSender>();
   }

After registering Hangfire types, you can now choose features you need to add to your application. The following snippet shows you how to add the Dashboard UI, and the background job server, to use all the Hangfire features now. The following lines are fully optional, and you can remove them completely, if your application will only create background jobs, while separate application will process them.

.. code-block:: csharp
   :emphasize-lines: 8-9

   public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
   {
       // ...

       app.UseStaticFiles();
       app.UseIdentity();

       app.UseHangfireDashboard();
       app.UseHangfireServer();

       app.UseMvc(routes =>
       {
           routes.MapRoute(
               name: "default",
               template: "{controller=Home}/{action=Index}/{id?}");
       });
   }

Testing installation
---------------------

.. code-block:: bash
   
   dotnet run

.. image:: https://cdn.hangfire.io/img/ui/dashboard.png

Adding background jobs
-----------------------

Once we have Hangfire working, let's add some background jobs. In the basic template, we have ``IEmailSender`` and ``ISmsSender`` interfaces. They are used to send messages to the users. But consider your SMTP, or a network between server and your application became very slow. Instead of forcing a user to wait, we'll send our messages in background.

.. code-block:: csharp
   :emphasize-lines: 11-12,16-17

   [HttpPost]
   [AllowAnonymous]
   [ValidateAntiForgeryToken]
   public async Task<IActionResult> SendCode(SendCodeViewModel model)
   {
       // ...

       var message = "Your security code is: " + code;
       if (model.SelectedProvider == "Email")
       {
           var email = await _userManager.GetEmailAsync(user);
           _jobs.Enqueue<IEmailSender>(x => x.SendEmailAsync(email, "Security Code", message));
       }
       else if (model.SelectedProvider == "Phone")
       {
           var phoneNumber = await _userManager.GetPhoneNumberAsync(user);
           _jobs.Enqueue<ISmsSender>(x => x.SendSmsAsync(phoneNumber, message));
       }

       // ...
   }   