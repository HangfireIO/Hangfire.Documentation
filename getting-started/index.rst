Getting Started
================

.. admonition:: Under construction
   :class: warning

   Getting Started: framework, requirements (.net frameworks, persistent storage, json.net, application types, environments, ready for bad environments with at least once processing), packages (official, community, versioning, updating, highest dependency, NuGet version), basic usage (console app, global configuration (only once, startup, chain calls), client, server, comments). Strong naming via strongnamer.

In this article I'll describe a common aproach to start using the library, and give an overview of all the main Hangfire components – Client, Storage and Server. If you want to see more user-friendly approach in common environments, see the subsections.

Installation
-------------

Hangfire is distributed as a couple of NuGet packages, starting from the primary one, Hangfire.Core, that contains all the primary classes as well as abstractions. Other packages like Hangfire.SqlServer providing features or abstraction implementations. To start using Hangfire, install the primary package and choose one of the :doc:`available storages </storages/index>`.

After release of Visual Studio 2017, a completely new way of installing NuGet packages appeared. So I give up listing all the ways of installing a NuGet package, and fallback to the Package Manager Console window commands everywhere in the documentation.

.. code:: powershell

   Install-Package Hangfire.Core
   Install-Package Hangfire.SqlServer

Configuration
--------------

Configuration is performed using the ``GlobalConfiguration`` class, its ``Configuration`` property provides a lot of extension method, both provided by Hangfire.Core, as well as other packages. If you install a new package, don't hesitate to check whether a new method is appeared. 

.. code-block:: c#

   GlobalConfiguration.Configuration
       .UseColouredConsoleLogProvider()
       .UseSqlServerStorage("Database=Hangfire.Sample; Integrated Security=True")
       .UseBatches()
       .UsePerformanceCounters();

Method calls can be chained, so there's no need to use the class name again and again. Global configuration is made for simplicity, almost each class of Hangfire also allows you to specify overrides for storage, filters, etc. In ASP.NET Core environments global configuration class is hidden inside the ``AddHangfire`` method.

Usage
------

Here are all the Hangfire components in action. You can think that's too few lines code to be true, but it's fully working sample that prints the "Hello, world!" message from a background thread. You can comment the lines related to server, and run the program several times – all the background jobs will be processed as soon as you uncomment the lines again.

.. code-block:: c#
   :emphasize-lines: 2,10,11,13,15

   using System;
   using Hangfire;

   namespace ConsoleApplication2
   {
       class Program
       {
           static void Main()
           {
               GlobalConfiguration.Configuration
                   .UseSqlServerStorage("Database=Sample; Integrated Security=True");

               BackgroundJob.Enqueue(() => Console.WriteLine("Hello, world!"));

               using (var server = new BackgroundJobServer())
               {
                   Console.ReadLine();
               }
           }
       }
   }

.. toctree::
   :maxdepth: 1
   :hidden:

   aspnet-applications
   aspnet-core-applications
   console-applications
   windows-services