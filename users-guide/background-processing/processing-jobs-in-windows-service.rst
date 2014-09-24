Processing jobs in a Windows Service
=====================================

To start using Hangfire in a Windows Service, you'll need to install Hangfire packages to your console application first. So, use your Package Manager Console window to install it:

.. code-block:: powershell

   PM> Install-Package Hangfire.Core

Then, install the needed package for your job storage. For example, you need to execute the following command to use SQL Server:

.. code-block:: powershell

   PM> Install-Package Hangfire.SqlServer

.. note::

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
           private readonly BackgroundJobServer _server;

           public Service1()
           {
               InitializeComponent();

               var storage = new SqlServerStorage("connection_string");
               var options = new BackgroundJobServerOptions();

               _server = new BackgroundJobServer(options, storage);
           }

           protected override void OnStart(string[] args)
           {
               _server.Start();
           }

           protected override void OnStop()
           {
               _server.Stop();
           }
       }
   }

If you are new to Windows Services in .NET projects, it is always better to goole about them first, but for quick-start scenario you'll need only to add an installer and optionally configure it. To perform this step just go back to the design view of the service class, right click on it and choose the ``Add Installer`` menu item.

.. image:: add-installer.png
   :alt: Adding installer to Windows Service project
   :align: center

Then build your project, install your Windows Service and run it. If it fails, try look at your Windows Event Viewer for recent exceptions.

.. code-block:: powershell

   installutil <yourproject>.exe