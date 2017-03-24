Windows Services
=================

.. admonition:: Under construction
   :class: warning

   Windows Service: overview (don’t need windows service but can do this), choosing type (raw service, using TopShelf), installation (hangfire.core, storage), global configuration, sample jobs, event log, optional OWIN-based dashboard.

To start using Hangfire in a Windows Service, you'll need to install Hangfire packages to your console application first. So, use your Package Manager Console window to install it:

.. code-block:: powershell

   PM> Install-Package Hangfire.Core

Then, install the needed package for your job storage. For example, you need to execute the following command to use SQL Server:

.. code-block:: powershell

   PM> Install-Package Hangfire.SqlServer

.. admonition:: ``Hangfire.Core`` package is enough
   :class: note

   Please don't install the ``Hangfire`` package for console applications as it is a quick-start package only and contain dependencies you may not need (for example, ``Microsoft.Owin.Host.SystemWeb``).

After installing packages, all you need is to create a new *Hangfire Server* instance and start it as written in the :doc:`Processing background jobs <processing-background-jobs>` chapter. So, open the source code of the file that describes the service and modify it as written below.

.. code-block:: c#

   using System.ServiceProcess;
   using Hangfire;
   using Hangfire.SqlServer;

   namespace WindowsService1
   {
       public partial class Service1 : ServiceBase
       {
           private BackgroundJobServer _server;

           public Service1()
           {
               InitializeComponent();

               GlobalConfiguration.Configuration.UseSqlServerStorage("connection_string");
           }

           protected override void OnStart(string[] args)
           {
               _server = new BackgroundJobServer();
           }

           protected override void OnStop()
           {
               _server.Dispose();
           }
       }
   }

If you are new to Windows Services in .NET projects, it is always better to google about them first, but for quick-start scenario you'll need only to add an installer and optionally configure it. To perform this step just go back to the design view of the service class, right click on it and choose the ``Add Installer`` menu item.

.. image:: add-installer.png
   :alt: Adding installer to Windows Service project
   :align: center

Then build your project, install your Windows Service and run it. If it fails, try look at your Windows Event Viewer for recent exceptions.

.. code-block:: powershell

   installutil <yourproject>.exe
