Console Applications
=====================

.. admonition:: Under construction
   :class: warning

   Console Application: simple cases or worker role or webjobs, installation (hangfire.core, storage, Windows, Linux), global configuration, console logging, sample jobs, lifetime (supervisor, signals and graceful shutdown), optional OWIN-based dashboard.

To start using Hangfire in a console application, you'll need to install Hangfire packages to your console application first. So, use your Package Manager Console window to install it:

.. code-block:: powershell

   PM> Install-Package Hangfire.Core

Then, install the needed package for your job storage. For example, you need to execute the following command to use SQL Server:

.. code-block:: powershell

   PM> Install-Package Hangfire.SqlServer

.. admonition:: ``Hangfire.Core`` package is enough
   :class: note

   Please don't install the ``Hangfire`` package for console applications as it is a quick-start package only and contain dependencies you may not need (for example, ``Microsoft.Owin.Host.SystemWeb``).

After installing packages, all you need is to create a new *Hangfire Server* instance and start it as written in the :doc:`previous <processing-background-jobs>` chapter. However, there are some details here:

* Since the ``Start`` method is **non-blocking**, we insert a ``Console.ReadKey`` call to prevent instant shutdown of an application.
* The call to ``Stop`` method is implicit -- it is made through the ``using`` statement.

.. code-block:: c#

   using System;
   using Hangfire;
   using Hangfire.SqlServer;

   namespace ConsoleApplication2
   {
       class Program
       {
           static void Main()
           {
               GlobalConfiguration.Configuration.UseSqlServerStorage("connection_string");

               using (var server = new BackgroundJobServer())
               {
                   Console.WriteLine("Hangfire Server started. Press any key to exit...");
                   Console.ReadKey();
               }
           }
       }
   }

Using Dashboard
----------------