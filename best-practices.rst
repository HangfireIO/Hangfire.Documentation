Best Practices
===============

Background job processing can differ a lot from a regular method invocation. This guide will help you keep background processing running smoothly and efficiently. The information given here is based off of `this blog post <http://odinserj.net/2014/05/10/are-your-methods-ready-to-run-in-background/>`_.

Make job arguments small and simple
------------------------------------

Method invocation (i.e. a job) is serialized during the background job creation process. Arguments are converted into JSON strings using the `TypeConverter` class. If you have complex entities and/or large objects; including arrays, it is better to place them into a database, and then pass only their identities to the background job.

Instead of doing this:

.. code-block:: c#

   public void Method(Entity entity) { }

Consider doing this:

.. code-block:: c#

   public void Method(int entityId) { }

Make your background methods reentrant
---------------------------------------

`Reentrancy <https://en.wikipedia.org/wiki/Reentrant_(subroutine)>`_ means that a method can be interrupted in the middle of its execution and then safely called again. The interruption can be caused by many different things (i.e. exceptions, server shut-down), and Hangfire will attempt to retry processing many times.

You can have many problems, if you don't prepare your jobs to be reentrant. For example, if you are using an email sending background job and experience an error with your SMTP service, you can end with multiple emails sent to the addressee. 

Instead of doing this:

.. code-block:: c#

   public void Method()
   {
       _emailService.Send("person@example.com", "Hello!");
   }

Consider doing this:

.. code-block:: c#

   public void Method(int deliveryId)
   {
       if (_emailService.IsNotDelivered(deliveryId))
       {
           _emailService.Send("person@example.com", "Hello!");
           _emailService.SetDelivered(deliveryId);
       }
   }

*To be continued…*
