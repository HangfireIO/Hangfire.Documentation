Processing Jobs in a Console Application
=========================================

To start using Hangfire in a console application, you'll need to install Hangfire packages to your console application first. So, use your Package Manager Console window to install it:

.. code-block:: powershell

   PM> Install-Package Hangfire.Core

Then, install the needed package for your job storage. For example, you need to execute the following command to use SQL Server:

.. code-block:: powershell

   PM> Install-Package Hangfire.SqlServer

.. admonition:: ``Hangfire.Core`` package is enough
   :class: note

   Please don't install the ``Hangfire`` package for console applications as it is a quick-start package only and contain dependencies you may not need (for example, ``Microsoft.Owin.Host.SystemWeb``).

After installing the packages, all you need is to create a new *Hangfire Server* instance that's responsible for background job processing. You can do this by creating a new instance of the ``BackgroundJobServer`` class, which will bootstrap everything required for background job processing in its constructor.

However, since we shouldn't exit from our console application immediately, we should block it somehow, and the easiest way is to use the ``Console.ReadKey`` method as shown below.

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
