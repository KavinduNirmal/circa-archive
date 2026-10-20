using Circa.Auth.Application;
using Circa.Auth.Domain;
using Microsoft.Extensions.Options;

namespace Circa.Modules.Auth.Tests;

public sealed class AccountValidatorTests
{
    [Theory]
    [InlineData("ab")]
    [InlineData("abcdefghijklmnopqrstu")]
    [InlineData("name.with.dot")]
    [InlineData("name with space")]
    [InlineData("naïve")]
    [InlineData("sHiThead")]
    public async Task RejectsInvalidOrBlockedUsernames(string name)
    {
        var validator = new AccountValidator(Options.Create(new UsernamePolicyOptions()));
        Assert.False((await validator.ValidateAsync(null!, AppUser.Create(name, "user@example.com"))).Succeeded);
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("ABCDEFGHIJKLMNOPQRST")]
    [InlineData("analyst_123")]
    public async Task AcceptsValidUsernames(string name)
    {
        var validator = new AccountValidator(Options.Create(new UsernamePolicyOptions()));
        Assert.True((await validator.ValidateAsync(null!, AppUser.Create(name, "user@example.com"))).Succeeded);
    }

    [Theory]
    [InlineData("invalid")]
    [InlineData("Analyst <user@example.com>")]
    public async Task RejectsInvalidEmail(string email)
    {
        var validator = new AccountValidator(Options.Create(new UsernamePolicyOptions()));
        Assert.False((await validator.ValidateAsync(null!, AppUser.Create("analyst", email))).Succeeded);
    }
}
